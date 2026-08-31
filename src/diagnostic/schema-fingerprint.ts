import JSZip from 'jszip'
import { HEADER_SIGNATURES } from '../detector/signatures'
import { detectUploadedFile } from '../detector/detector'
import {
  normaliseHeader,
  parseCsvHeaders,
  parseCsvRows,
  readXlsxWorkbook,
} from '../parsers/parser-utils'
import type { ExportCategory } from '../types/export-types'
import type { NormalisedArchive, UploadedFile } from '../types/models'
import type { SchemaFingerprintFile, SchemaFingerprintReport } from '../types/diagnostic'

const PRODUCT_VERSION = '0.1.0-alpha'
const LAUNCH_GATE_REMINDER =
  'Before production launch: validate against at least one genuine Harvest archive. This diagnostic reports schema shape only — not production compatibility.'

const DATE_COLUMN_CANDIDATES = ['date', 'issue date', 'due date', 'paid date', 'payment date', 'spent date']

export function sanitiseFilename(filename: string): string {
  const parts = filename.split(/[\\/]/)
  const base = parts[parts.length - 1] ?? filename
  const dot = base.lastIndexOf('.')
  const name = dot > 0 ? base.slice(0, dot) : base
  const ext = dot > 0 ? base.slice(dot) : ''

  const sanitisedName = name
    .replace(/\d{4,}/g, '####')
    .replace(/[A-Z]{2,}-\d+/gi, 'ID-####')
    .replace(/INV[-_]?\d+/gi, 'INV-####')
    .replace(/EST[-_]?\d+/gi, 'EST-####')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[email]')
    .replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g, '[name]')
    .replace(/\b[A-Za-z]{3,}\b/g, (word) => {
      if (/^(csv|xlsx|xls|pdf|zip|txt|invoice|estimate|time|entries|report)$/i.test(word)) {
        return word
      }
      return '[word]'
    })

  return `${sanitisedName}${ext}`
}

export function redactPdfFilenamePattern(filename: string): string {
  return sanitiseFilename(filename)
}

function inferDatePattern(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return 'YYYY-MM-DD'
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return 'M/D/YYYY'
  if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(trimmed)) return 'M/D/YY'
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) return 'D-M-YYYY'
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) return 'YYYY/MM/DD'
  return 'other'
}

function inferDateFormatPatterns(
  headers: string[],
  rows: Record<string, string>[],
): string[] {
  const normalisedHeaders = new Map(headers.map((h) => [normaliseHeader(h), h]))
  const patterns = new Set<string>()

  for (const candidate of DATE_COLUMN_CANDIDATES) {
    const header = normalisedHeaders.get(candidate)
    if (!header) continue

    for (const row of rows.slice(0, 50)) {
      const value = row[header]
      if (!value) continue
      const pattern = inferDatePattern(value)
      if (pattern) patterns.add(pattern)
    }
  }

  return [...patterns].sort()
}

function expectedColumnsForCategory(category: ExportCategory): string[] {
  const sig = HEADER_SIGNATURES.find((s) => s.category === category)
  if (!sig) return []
  return [...sig.requiredHeaders, ...(sig.optionalHeaders ?? [])]
}

function buildExpectedColumnPresence(
  category: ExportCategory,
  headers: string[],
): Record<string, boolean> | undefined {
  const expected = expectedColumnsForCategory(category)
  if (expected.length === 0) return undefined

  const present = new Set(headers.map(normaliseHeader))
  const result: Record<string, boolean> = {}
  for (const col of expected) {
    result[col] = present.has(normaliseHeader(col))
  }
  return result
}

function countRows(file: UploadedFile, extension: string): number | undefined {
  if (extension === '.csv' || extension === '.txt') {
    const text = file.textContent ?? new TextDecoder('utf-8').decode(file.content)
    return parseCsvRows(text).length
  }
  if (extension === '.xlsx' || extension === '.xls') {
    return readXlsxWorkbook(file.content).rowCount
  }
  return undefined
}

function getHeaders(file: UploadedFile, extension: string): {
  headers: string[]
  sheetNames?: string[]
  sheetCount?: number
} {
  if (extension === '.csv' || extension === '.txt') {
    const text = file.textContent ?? new TextDecoder('utf-8').decode(file.content)
    return { headers: parseCsvHeaders(text) }
  }
  if (extension === '.xlsx' || extension === '.xls') {
    const workbook = readXlsxWorkbook(file.content)
    return {
      headers: workbook.headers,
      sheetNames: workbook.sheetNames,
      sheetCount: workbook.sheetNames.length,
    }
  }
  return { headers: [] }
}

function parserWarningsForFile(
  archive: NormalisedArchive,
  filename: string,
): { count: number; messages: string[] } {
  const messages = new Set<string>()
  for (const warning of archive.parsingWarnings) {
    if (warning.sourceFile === filename) {
      messages.add(warning.message)
    }
  }
  return { count: messages.size, messages: [...messages].sort() }
}

async function summariseZipMembers(file: UploadedFile): Promise<Array<{ extension: string; count: number }>> {
  const zip = await JSZip.loadAsync(file.content)
  const counts = new Map<string, number>()

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue
    const name = entry.name.split('/').pop() ?? entry.name
    const dot = name.lastIndexOf('.')
    const ext = dot > 0 ? name.slice(dot).toLowerCase() : '(no extension)'
    counts.set(ext, (counts.get(ext) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([extension, count]) => ({ extension, count }))
    .sort((a, b) => b.count - a.count)
}

async function fingerprintFile(
  file: UploadedFile,
  archive: NormalisedArchive,
): Promise<SchemaFingerprintFile> {
  const detection = await detectUploadedFile(file)
  const extensionMatch = file.filename.match(/\.[^.]+$/)
  const extension = extensionMatch ? extensionMatch[0].toLowerCase() : ''
  const lower = file.filename.toLowerCase()

  const { headers, sheetNames, sheetCount } = getHeaders(file, extension)
  const rowCount = countRows(file, extension)
  const rows =
    extension === '.csv' || extension === '.txt'
      ? parseCsvRows(file.textContent ?? new TextDecoder('utf-8').decode(file.content))
      : []

  const parserWarnings = parserWarningsForFile(archive, file.filename)

  const fingerprint: SchemaFingerprintFile = {
    filename: file.filename,
    sanitizedFilename: sanitiseFilename(file.filename),
    extension,
    detectedCategory: detection.category,
    detectorConfidence: detection.confidence,
    detectionMethod: detection.detectionMethod,
    isDuplicate: detection.isDuplicate,
    parserWarningCount: parserWarnings.count,
    parserWarningMessages: parserWarnings.messages,
  }

  if (headers.length > 0) {
    fingerprint.columnHeaders = headers
    fingerprint.expectedColumnPresence = buildExpectedColumnPresence(detection.category, headers)
  }

  if (rowCount !== undefined) fingerprint.rowCount = rowCount
  if (sheetNames) fingerprint.xlsxSheetNames = sheetNames
  if (sheetCount !== undefined) fingerprint.xlsxSheetCount = sheetCount

  if (rows.length > 0 && headers.length > 0) {
    const patterns = inferDateFormatPatterns(headers, rows)
    if (patterns.length > 0) fingerprint.dateFormatPatterns = patterns
  }

  if (lower.endsWith('.pdf')) {
    fingerprint.pdfFilenamePattern = redactPdfFilenamePattern(file.filename)
  }

  if (lower.endsWith('.zip')) {
    fingerprint.zipMemberSummary = await summariseZipMembers(file)
  }

  return fingerprint
}

export async function generateSchemaFingerprint(
  files: UploadedFile[],
  archive: NormalisedArchive,
): Promise<SchemaFingerprintReport> {
  const fingerprints: SchemaFingerprintFile[] = []

  for (const file of files) {
    if (file.filename.toLowerCase().endsWith('.zip')) {
      fingerprints.push(await fingerprintFile(file, archive))
      const zip = await JSZip.loadAsync(file.content)
      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue
        const content = await entry.async('arraybuffer')
        const filename = path.split('/').pop() ?? path
        const isText = filename.toLowerCase().endsWith('.csv')
        const innerFile: UploadedFile = {
          filename,
          mimeType: isText ? 'text/csv' : 'application/octet-stream',
          content,
          textContent: isText ? new TextDecoder('utf-8').decode(content) : undefined,
        }
        fingerprints.push(await fingerprintFile(innerFile, archive))
      }
      continue
    }

    fingerprints.push(await fingerprintFile(file, archive))
  }

  const detectedCategories = [
    ...new Set(
      fingerprints
        .filter((f) => !f.isDuplicate && f.detectedCategory !== 'unknown')
        .map((f) => f.detectedCategory),
    ),
  ]

  return {
    generatedAt: new Date().toISOString(),
    productVersion: PRODUCT_VERSION,
    totalFiles: fingerprints.length,
    detectedCategories,
    unknownFileCount: fingerprints.filter((f) => f.detectedCategory === 'unknown').length,
    files: fingerprints,
    launchGateReminder: LAUNCH_GATE_REMINDER,
  }
}

export function serialiseSchemaFingerprint(report: SchemaFingerprintReport): string {
  return JSON.stringify(report, null, 2)
}

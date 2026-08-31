import type { ExportCategory } from '../types/export-types'
import type { DetectedFile, UploadedFile } from '../types/models'
import { FILENAME_PATTERNS, HEADER_SIGNATURES, PDF_PATTERNS } from './signatures'
import { normaliseHeader, parseCsvHeaders, parseXlsxHeaders } from '../parsers/parser-utils'

export interface DetectionInput {
  filename: string
  mimeType: string
  headers?: string[]
  isPdf?: boolean
  contentHash?: string
}

export function detectByFilename(filename: string): { category: ExportCategory; confidence: 'medium' | 'low' } | null {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.pdf')) {
    for (const { pattern, category } of PDF_PATTERNS) {
      if (pattern.test(filename)) {
        return { category, confidence: 'medium' }
      }
    }
    return { category: 'unknown', confidence: 'low' }
  }

  for (const { pattern, category } of FILENAME_PATTERNS) {
    if (pattern.test(filename)) {
      return { category, confidence: 'medium' }
    }
  }

  return null
}

export function detectByHeaders(headers: string[]): { category: ExportCategory; confidence: 'high' | 'medium'; method: string } | null {
  const normalised = headers.map(normaliseHeader)

  // Strong signal: Date + Hours together indicates time entries
  if (normalised.includes('date') && normalised.includes('hours')) {
    return {
      category: 'time_entries',
      confidence: 'high',
      method: 'headers: date + hours present',
    }
  }

  // Strong signal: Amount + Date indicates expenses (not projects)
  if (normalised.includes('amount') && normalised.includes('date')) {
    return {
      category: 'expenses',
      confidence: 'high',
      method: 'headers: amount + date present',
    }
  }

  // Projects must have project + client but not amount (which indicates expenses)
  if (
    normalised.includes('project') &&
    normalised.includes('client') &&
    !normalised.includes('amount')
  ) {
    return {
      category: 'projects',
      confidence: 'high',
      method: 'headers: project + client without amount',
    }
  }

  let best: { category: ExportCategory; score: number; method: string } | null = null

  for (const sig of HEADER_SIGNATURES) {
    const required = sig.requiredHeaders.map(normaliseHeader)
    const optional = (sig.optionalHeaders ?? []).map(normaliseHeader)
    const all = [...required, ...optional]

    const requiredMatches = required.filter((h) => normalised.includes(h)).length
    const optionalMatches = optional.filter((h) => normalised.includes(h)).length
    const totalMatches = requiredMatches + optionalMatches

    if (requiredMatches < required.length) continue

    const ratio = totalMatches / all.length
    const minRatio = sig.minMatchRatio ?? 0.5
    if (ratio < minRatio) continue

    const score = requiredMatches * 10 + optionalMatches + ratio
    if (!best || score > best.score) {
      best = {
        category: sig.category,
        score,
        method: `headers: ${requiredMatches}/${required.length} required, ${optionalMatches} optional`,
      }
    }
  }

  if (!best) return null
  return {
    category: best.category,
    confidence: best.score >= 15 ? 'high' : 'medium',
    method: best.method,
  }
}

export function detectFile(input: DetectionInput): DetectedFile {
  const { filename, mimeType } = input

  if (input.isPdf || mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
    for (const { pattern, category } of PDF_PATTERNS) {
      if (pattern.test(filename)) {
        return {
          filename,
          mimeType,
          category,
          confidence: 'high',
          detectionMethod: `pdf filename pattern: ${pattern}`,
          isDuplicate: false,
        }
      }
    }
    return {
      filename,
      mimeType,
      category: 'unknown',
      confidence: 'low',
      detectionMethod: 'unrecognised PDF',
      isDuplicate: false,
    }
  }

  if (input.headers && input.headers.length > 0) {
    const headerResult = detectByHeaders(input.headers)
    if (headerResult) {
      return {
        filename,
        mimeType,
        category: headerResult.category,
        confidence: headerResult.confidence,
        detectionMethod: headerResult.method,
        isDuplicate: false,
      }
    }
  }

  const filenameResult = detectByFilename(filename)
  if (filenameResult) {
    return {
      filename,
      mimeType,
      category: filenameResult.category,
      confidence: filenameResult.confidence,
      detectionMethod: 'filename pattern',
      isDuplicate: false,
    }
  }

  return {
    filename,
    mimeType,
    category: 'unknown',
    confidence: 'low',
    detectionMethod: 'no match',
    isDuplicate: false,
  }
}

export async function detectUploadedFile(file: UploadedFile): Promise<DetectedFile> {
  const lower = file.filename.toLowerCase()

  if (lower.endsWith('.pdf') || file.mimeType === 'application/pdf') {
    return detectFile({ filename: file.filename, mimeType: file.mimeType, isPdf: true })
  }

  let headers: string[] | undefined

  if (lower.endsWith('.csv') || file.mimeType.includes('csv') || file.mimeType === 'text/plain') {
    const text = file.textContent ?? new TextDecoder('utf-8').decode(file.content)
    headers = parseCsvHeaders(text)
  } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || file.mimeType.includes('spreadsheet')) {
    headers = parseXlsxHeaders(file.content)
  }

  return detectFile({
    filename: file.filename,
    mimeType: file.mimeType,
    headers,
  })
}

export function markDuplicates(files: DetectedFile[]): DetectedFile[] {
  const seen = new Map<string, string>()

  return files.map((file) => {
    const key = file.filename.toLowerCase()
    if (seen.has(key)) {
      return {
        ...file,
        isDuplicate: true,
        duplicateOf: seen.get(key),
      }
    }
    seen.set(key, file.filename)
    return file
  })
}

export function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 5))
  const header = String.fromCharCode(...bytes)
  return header.startsWith('%PDF')
}

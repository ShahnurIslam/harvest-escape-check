import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export function normaliseHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, ' ')
}

export function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, '')
}

export function parseCsvHeaders(text: string): string[] {
  const cleaned = stripBom(text)
  const result = Papa.parse<string[]>(cleaned, {
    preview: 1,
    header: false,
    skipEmptyLines: true,
  })
  return (result.data[0] ?? []).map((h) => String(h).trim())
}

export function parseCsvRows(text: string): Record<string, string>[] {
  const cleaned = stripBom(text)
  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  return result.data.filter((row) => Object.values(row).some((v) => v && String(v).trim()))
}

export function parseXlsxHeaders(buffer: ArrayBuffer): string[] {
  return readXlsxWorkbook(buffer).headers
}

export function readXlsxWorkbook(buffer: ArrayBuffer): {
  sheetNames: string[]
  headers: string[]
  rowCount: number
} {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { sheetNames: [], headers: [], rowCount: 0 }
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
  const headerRow = rows[0] ?? []
  const headers = headerRow.map((h) => String(h).trim()).filter(Boolean)
  const rowCount = Math.max(0, rows.length - 1)
  return { sheetNames: workbook.SheetNames, headers, rowCount }
}

export function parseXlsxRows(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
  return rows.filter((row) => Object.values(row).some((v) => v && String(v).trim()))
}

export function findColumn(row: Record<string, string>, ...candidates: string[]): string | undefined {
  const keys = Object.keys(row)
  const normalised = new Map(keys.map((k) => [normaliseHeader(k), k]))

  for (const candidate of candidates) {
    const key = normalised.get(normaliseHeader(candidate))
    if (key !== undefined) {
      const val = row[key]
      if (val !== undefined && val !== '') return String(val).trim()
    }
  }
  return undefined
}

export function parseNumber(value: string | undefined): number | undefined {
  if (!value || !value.trim()) return undefined
  const cleaned = value.replace(/[£$€,\s]/g, '').replace(/^\((.+)\)$/, '-$1')
  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : undefined
}

export function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined
  const lower = value.trim().toLowerCase()
  if (['yes', 'true', '1', 'y'].includes(lower)) return true
  if (['no', 'false', '0', 'n'].includes(lower)) return false
  return undefined
}

export function parseDate(value: string | undefined): { value?: string; valid: boolean } {
  if (!value || !value.trim()) return { valid: false }
  const trimmed = value.trim()

  const isoMatch = /^\d{4}-\d{2}-\d{2}/.test(trimmed)
  if (isoMatch) return { value: trimmed.slice(0, 10), valid: true }

  const slashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (slashMatch) {
    const [, a, b, c] = slashMatch
    const year = c.length === 2 ? `20${c}` : c
    const month = a.length === 4 ? b.padStart(2, '0') : a.padStart(2, '0')
    const day = a.length === 4 ? a.padStart(2, '0') : b.padStart(2, '0')
    return { value: `${year}-${month}-${day}`, valid: true }
  }

  const parsed = Date.parse(trimmed)
  if (!Number.isNaN(parsed)) {
    return { value: new Date(parsed).toISOString().slice(0, 10), valid: true }
  }

  return { valid: false }
}

export function rowNumber(index: number): number {
  return index + 2
}

export function makeWarning(message: string, sourceFile: string, sourceRow?: number) {
  return { message, sourceFile, sourceRow }
}

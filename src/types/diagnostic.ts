import type { ExportCategory } from './export-types'

export interface SchemaFingerprintFile {
  filename: string
  sanitizedFilename: string
  extension: string
  detectedCategory: ExportCategory
  detectorConfidence: 'high' | 'medium' | 'low'
  detectionMethod: string
  isDuplicate: boolean
  rowCount?: number
  columnHeaders?: string[]
  xlsxSheetNames?: string[]
  xlsxSheetCount?: number
  dateFormatPatterns?: string[]
  expectedColumnPresence?: Record<string, boolean>
  parserWarningCount: number
  parserWarningMessages: string[]
  pdfFilenamePattern?: string
  zipMemberSummary?: Array<{ extension: string; count: number }>
}

export interface SchemaFingerprintReport {
  generatedAt: string
  productVersion: string
  totalFiles: number
  detectedCategories: ExportCategory[]
  unknownFileCount: number
  files: SchemaFingerprintFile[]
  launchGateReminder: string
}

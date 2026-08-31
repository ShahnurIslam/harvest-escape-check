import { describe, it, expect } from 'vitest'
import { detectByHeaders, detectByFilename, detectFile, markDuplicates } from '../detector/detector'

describe('file detector', () => {
  it('detects time entries by headers', () => {
    const result = detectByHeaders(['Date', 'Client', 'Project', 'Task', 'Hours', 'Billable?'])
    expect(result).not.toBeNull()
    expect(result!.category).toBe('time_entries')
    expect(result!.confidence).toBe('high')
  })

  it('detects projects by headers', () => {
    const result = detectByHeaders(['Project', 'Client', 'Code', 'Active'])
    expect(result).not.toBeNull()
    expect(result!.category).toBe('projects')
  })

  it('detects invoices by headers', () => {
    const result = detectByHeaders(['Invoice Id', 'Invoice Number', 'Client', 'Amount', 'Currency'])
    expect(result).not.toBeNull()
    expect(result!.category).toBe('invoices')
  })

  it('detects payments by headers', () => {
    const result = detectByHeaders(['Payment Id', 'Invoice Number', 'Amount', 'Paid Date'])
    expect(result).not.toBeNull()
    expect(result!.category).toBe('payments')
  })

  it('detects by filename when headers unavailable', () => {
    const result = detectByFilename('time_entries_2024.csv')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('time_entries')
  })

  it('detects invoice PDFs by filename', () => {
    const result = detectFile({
      filename: 'INV-1842.pdf',
      mimeType: 'application/pdf',
      isPdf: true,
    })
    expect(result.category).toBe('invoice_pdfs')
    expect(result.confidence).toBe('high')
  })

  it('detects harvest-axi style invoice PDF filenames', () => {
    const result = detectFile({
      filename: 'invoice-13150403-12345.pdf',
      mimeType: 'application/pdf',
      isPdf: true,
    })
    expect(result.category).toBe('invoice_pdfs')
  })

  it('detects estimate PDFs by filename', () => {
    const result = detectFile({
      filename: 'EST-0042.pdf',
      mimeType: 'application/pdf',
      isPdf: true,
    })
    expect(result.category).toBe('estimate_pdfs')
  })

  it('marks unknown PDFs', () => {
    const result = detectFile({
      filename: 'random_document.pdf',
      mimeType: 'application/pdf',
      isPdf: true,
    })
    expect(result.category).toBe('unknown')
  })

  it('marks duplicate files', () => {
    const files = [
      { filename: 'clients.csv', mimeType: 'text/csv', category: 'clients' as const, confidence: 'high' as const, detectionMethod: 'test', isDuplicate: false },
      { filename: 'clients.csv', mimeType: 'text/csv', category: 'clients' as const, confidence: 'high' as const, detectionMethod: 'test', isDuplicate: false },
    ]
    const marked = markDuplicates(files)
    expect(marked[1].isDuplicate).toBe(true)
    expect(marked[1].duplicateOf).toBe('clients.csv')
  })

  it('tolerates reordered columns', () => {
    const result = detectByHeaders(['Hours', 'Date', 'Project', 'Client', 'Task', 'Notes'])
    expect(result).not.toBeNull()
    expect(result!.category).toBe('time_entries')
  })

  it('does not guess ambiguous schemas', () => {
    const result = detectByHeaders(['Name', 'Value'])
    expect(result).toBeNull()
  })
})

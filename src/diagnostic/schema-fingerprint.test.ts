import { describe, it, expect } from 'vitest'
import {
  generateFixture,
  HEALTHY_CONFIG,
  fixtureToUploadedFiles,
} from '../fixtures/generator'
import { processUploadedFiles } from '../pipeline/process-archive'
import { serialiseSchemaFingerprint } from './schema-fingerprint'

const SENSITIVE_MARKERS = [
  'Alex Ltd 1',
  'alex.smith@example.com',
  '123 Main St',
  'Service 1',
  'Expense 1',
  'INV-ID-1',
  'CL-0001',
  'PRJ-0001',
  'contact1@example.com',
  'Contact,Person',
]

describe('schema fingerprint diagnostic', () => {
  it('produces a report for the healthy fixture', async () => {
    const fixture = generateFixture(HEALTHY_CONFIG)
    const files = fixtureToUploadedFiles(fixture)
    const { schemaFingerprint } = await processUploadedFiles(files)

    expect(schemaFingerprint.totalFiles).toBeGreaterThan(0)
    expect(schemaFingerprint.detectedCategories).toContain('time_entries')
    expect(schemaFingerprint.detectedCategories).toContain('invoices')
    expect(schemaFingerprint.files.some((f) => f.columnHeaders && f.columnHeaders.length > 0)).toBe(
      true,
    )
  })

  it('does not leak sensitive fixture values in serialised output', async () => {
    const fixture = generateFixture(HEALTHY_CONFIG)
    const files = fixtureToUploadedFiles(fixture)
    const { schemaFingerprint } = await processUploadedFiles(files)
    const json = serialiseSchemaFingerprint(schemaFingerprint)

    for (const marker of SENSITIVE_MARKERS) {
      expect(json.includes(marker), `Leaked sensitive marker: ${marker}`).toBe(false)
    }

    expect(json.includes('@example.com')).toBe(false)
    expect(json.includes('Main St')).toBe(false)
  })

  it('redacts PDF filename patterns', async () => {
    const fixture = generateFixture(HEALTHY_CONFIG)
    const files = fixtureToUploadedFiles(fixture)
    const { schemaFingerprint } = await processUploadedFiles(files)
    const invoicePdf = schemaFingerprint.files.find((f) => f.extension === '.pdf')

    expect(invoicePdf?.pdfFilenamePattern).toBeDefined()
    expect(invoicePdf?.pdfFilenamePattern).not.toMatch(/INV-\d{4}\.pdf/)
  })
})

import { describe, it, expect } from 'vitest'
import {
  generateFixture,
  generateDamagedFixture,
  fixtureToUploadedFiles,
  HEALTHY_CONFIG,
  DAMAGED_DEFECTS,
} from '../fixtures/generator'
import { processUploadedFiles } from '../pipeline/process-archive'

describe('healthy archive integration', () => {
  it('produces high readiness score with no critical errors', async () => {
    const fixture = generateFixture(HEALTHY_CONFIG)
    const files = fixtureToUploadedFiles(fixture)
    const { audit } = await processUploadedFiles(files)

    expect(audit.summary.timeEntries).toBe(HEALTHY_CONFIG.timeEntryCount)
    expect(audit.summary.projects).toBe(HEALTHY_CONFIG.projectCount)
    expect(audit.summary.clients).toBe(HEALTHY_CONFIG.clientCount)
    expect(audit.summary.invoices).toBe(HEALTHY_CONFIG.invoiceCount)

    const critical = audit.findings.filter((f) => f.severity === 'critical')
    expect(critical.length).toBe(0)

    const warnings = audit.findings.filter((f) => f.severity === 'warning')
    expect(warnings.length).toBe(0)

    expect(audit.readiness.score).toBe(100)
  })

  it('detects all major export categories', async () => {
    const fixture = generateFixture(HEALTHY_CONFIG)
    const files = fixtureToUploadedFiles(fixture)
    const { audit } = await processUploadedFiles(files)

    expect(audit.presentCategories).toContain('time_entries')
    expect(audit.presentCategories).toContain('projects')
    expect(audit.presentCategories).toContain('clients')
    expect(audit.presentCategories).toContain('invoices')
    expect(audit.presentCategories).toContain('payments')
  })
})

describe('damaged archive integration', () => {
  it('detects planted defects', async () => {
    const fixture = generateDamagedFixture()
    const files = fixtureToUploadedFiles(fixture)

    // Add duplicate file
    const clientsFile = files.find((f) => f.filename === 'clients.csv')!
    files.push({ ...clientsFile })

    const { audit } = await processUploadedFiles(files)
    const ruleIds = new Set(audit.findings.map((f) => f.ruleId))

    const expectedRules = [
      'invoice.missing_pdf',
      'invoice.duplicate',
      'integrity.line_item_missing_invoice',
      'integrity.payment_missing_invoice',
      'integrity.time_missing_project',
      'integrity.time_missing_task',
      'integrity.expense_missing_project',
      'quality.duplicate_time_entry',
      'estimate.missing_pdf',
      'quality.duplicate_files',
      'quality.inconsistent_client_naming',
      'quality.blank_identifier',
      'quality.invalid_date',
      'invoice.unexpected_currency',
      'quality.unknown_files',
    ]

    for (const ruleId of expectedRules) {
      expect(ruleIds.has(ruleId), `Expected rule ${ruleId} to fire`).toBe(true)
    }
  })

  it('produces low readiness score', async () => {
    const fixture = generateDamagedFixture()
    const files = fixtureToUploadedFiles(fixture)
    const { audit } = await processUploadedFiles(files)

    expect(audit.readiness.score).toBeLessThan(70)
    expect(audit.readiness.state).toBe('not_ready')

    const critical = audit.findings.filter((f) => f.severity === 'critical')
    expect(critical.length).toBeGreaterThan(0)
  })

  it('maps defects to rules in fixture matrix', () => {
    const uniqueRules = new Set(DAMAGED_DEFECTS.map((d) => d.ruleId))
    expect(uniqueRules.size).toBeGreaterThanOrEqual(10)
    expect(DAMAGED_DEFECTS.length).toBeGreaterThanOrEqual(19)
  })
})

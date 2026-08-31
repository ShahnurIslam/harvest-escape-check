import { describe, it, expect } from 'vitest'
import { ruleDuplicateInvoices, ruleOverpayments, ruleUnexpectedCurrency, ruleCrossCurrencyAggregation } from '../audit/rules/invoice'
import { ruleTimeEntryProjectRef, ruleTimeEntryTaskRef } from '../audit/rules/integrity'
import { ruleDuplicateTimeEntries } from '../audit/rules/quality'
import type { AuditContext } from '../types/audit'
import type { NormalisedArchive } from '../types/models'
import { createEmptyArchive } from '../parsers/index'

function makeContext(overrides: Partial<NormalisedArchive>): AuditContext {
  const archive = { ...createEmptyArchive(), ...overrides }
  return {
    archive,
    presentCategories: [],
    missingCategories: [],
  }
}

describe('audit rules', () => {
  it('detects duplicate invoices', () => {
    const ctx = makeContext({
      invoices: [
        { sourceFile: 'inv.csv', sourceRow: 2, warnings: [], data: { id: '1', number: 'INV-001', amount: 100 } },
        { sourceFile: 'inv.csv', sourceRow: 3, warnings: [], data: { id: '1', number: 'INV-001', amount: 100 } },
      ],
    })
    const findings = ruleDuplicateInvoices(ctx)
    expect(findings.length).toBe(1)
    expect(findings[0].ruleId).toBe('invoice.duplicate')
  })

  it('detects overpayments', () => {
    const ctx = makeContext({
      invoices: [
        { sourceFile: 'inv.csv', warnings: [], data: { id: '1', number: 'INV-001', amount: 100, currency: 'GBP' } },
      ],
      payments: [
        { sourceFile: 'pay.csv', warnings: [], data: { invoiceNumber: 'INV-001', amount: 200, currency: 'GBP' } },
      ],
    })
    const findings = ruleOverpayments(ctx)
    expect(findings.length).toBe(1)
    expect(findings[0].ruleId).toBe('invoice.overpayment')
  })

  it('detects time entries with missing projects', () => {
    const ctx = makeContext({
      projects: [],
      timeEntries: [
        {
          sourceFile: 'time.csv',
          sourceRow: 2,
          warnings: [],
          data: { date: '2024-01-01', projectName: 'Ghost', hours: 4 },
        },
      ],
    })
    const findings = ruleTimeEntryProjectRef(ctx)
    expect(findings.length).toBe(1)
    expect(findings[0].ruleId).toBe('integrity.time_missing_project')
  })

  it('matches time entries to tasks by name when task export has ids', () => {
    const ctx = makeContext({
      tasks: [
        { sourceFile: 'tasks.csv', sourceRow: 2, warnings: [], data: { id: 'TSK-001', name: 'Design' } },
      ],
      timeEntries: [
        {
          sourceFile: 'time.csv',
          sourceRow: 2,
          warnings: [],
          data: { date: '2024-01-01', taskName: 'Design', hours: 4 },
        },
      ],
    })
    const findings = ruleTimeEntryTaskRef(ctx)
    expect(findings.length).toBe(0)
  })

  it('detects time entries with missing tasks', () => {
    const ctx = makeContext({
      tasks: [
        { sourceFile: 'tasks.csv', sourceRow: 2, warnings: [], data: { id: 'TSK-001', name: 'Design' } },
      ],
      timeEntries: [
        {
          sourceFile: 'time.csv',
          sourceRow: 2,
          warnings: [],
          data: { date: '2024-01-01', taskName: 'Phantom Task', hours: 4 },
        },
      ],
    })
    const findings = ruleTimeEntryTaskRef(ctx)
    expect(findings.length).toBe(1)
    expect(findings[0].ruleId).toBe('integrity.time_missing_task')
  })

  it('detects duplicate time entries', () => {
    const entry = {
      sourceFile: 'time.csv',
      sourceRow: 2,
      warnings: [],
      data: { date: '2024-01-01', projectName: 'P1', personName: 'Alex', hours: 4, notes: '' },
    }
    const ctx = makeContext({
      timeEntries: [entry, { ...entry, sourceRow: 3 }],
    })
    const findings = ruleDuplicateTimeEntries(ctx)
    expect(findings.length).toBe(1)
  })

  it('detects unexpected currency format', () => {
    const ctx = makeContext({
      invoices: [
        { sourceFile: 'inv.csv', warnings: [], data: { number: 'INV-1', amount: 100, currency: 'POUND' } },
      ],
    })
    const findings = ruleUnexpectedCurrency(ctx)
    expect(findings.length).toBe(1)
  })

  it('does not aggregate across currencies', () => {
    const ctx = makeContext({
      invoices: [
        { sourceFile: 'a', warnings: [], data: { amount: 100, currency: 'GBP' } },
        { sourceFile: 'a', warnings: [], data: { amount: 200, currency: 'USD' } },
      ],
    })
    const findings = ruleCrossCurrencyAggregation(ctx)
    expect(findings.length).toBe(1)
    expect(findings[0].explanation).toContain('GBP')
    expect(findings[0].explanation).toContain('USD')
  })
})

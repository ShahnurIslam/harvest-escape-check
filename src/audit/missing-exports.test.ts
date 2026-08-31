import { describe, it, expect } from 'vitest'
import { ruleMissingExports } from '../audit/rules/completeness'
import { createEmptyArchive } from '../parsers/index'
import type { AuditContext } from '../types/audit'

describe('missing exports rule', () => {
  it('flags missing payments export when invoices exist', () => {
    const ctx: AuditContext = {
      archive: {
        ...createEmptyArchive(),
        invoices: [
          { sourceFile: 'inv.csv', warnings: [], data: { number: 'INV-1', amount: 100 } },
        ],
      },
      presentCategories: ['invoices'],
      missingCategories: ['payments', 'time_entries', 'projects', 'clients'],
    }

    const findings = ruleMissingExports(ctx)
    const paymentsFinding = findings.find((f) => f.title.includes('Payments'))
    expect(paymentsFinding).toBeDefined()
    expect(paymentsFinding!.severity).toBe('warning')
  })
})

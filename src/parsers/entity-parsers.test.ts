import { describe, it, expect } from 'vitest'
import { parseTimeEntries, parseInvoices, parsePayments } from './entity-parsers'

describe('entity parsers', () => {
  it('parses time entries with reordered columns', () => {
    const rows = [
      { Hours: '4.5', Date: '2024-01-15', Project: 'Website', Client: 'Acme', Task: 'Design' },
    ]
    const parsed = parseTimeEntries(rows, 'test.csv')
    expect(parsed).toHaveLength(1)
    expect(parsed[0].data.hours).toBe(4.5)
    expect(parsed[0].data.projectName).toBe('Website')
    expect(parsed[0].sourceFile).toBe('test.csv')
  })

  it('warns on missing invoice identifiers', () => {
    const rows = [{ Client: 'Acme', Amount: '500', Currency: 'GBP' }]
    const parsed = parseInvoices(rows, 'invoices.csv')
    expect(parsed[0].warnings.length).toBeGreaterThan(0)
  })

  it('parses payments with invoice references', () => {
    const rows = [
      {
        'Payment Id': 'PAY-1',
        'Invoice Number': 'INV-0001',
        Amount: '1500',
        Currency: 'GBP',
        'Paid Date': '2024-02-01',
      },
    ]
    const parsed = parsePayments(rows, 'payments.csv')
    expect(parsed[0].data.invoiceNumber).toBe('INV-0001')
    expect(parsed[0].data.amount).toBe(1500)
  })
})

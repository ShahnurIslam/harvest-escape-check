import type { AuditFinding } from '../../types/audit'
import { buildInvoiceKeySet, invoiceKey, matchesInvoiceKey } from '../keys'

function groupByCurrency(
  invoices: Array<{ data: { amount: number; currency?: string } }>,
): Map<string, number> {
  const totals = new Map<string, number>()
  for (const inv of invoices) {
    const currency = inv.data.currency ?? 'UNKNOWN'
    totals.set(currency, (totals.get(currency) ?? 0) + inv.data.amount)
  }
  return totals
}

export function ruleDuplicateInvoices(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const seen = new Map<string, typeof context.archive.invoices>()
  const dupes: AuditFinding['affectedRecords'] = []

  for (const inv of context.archive.invoices) {
    const key = invoiceKey(inv.data.id, inv.data.number)
    if (!inv.data.id && !inv.data.number) continue
    const existing = seen.get(key)
    if (existing) {
      dupes.push({
        label: inv.data.number ?? inv.data.id ?? 'unknown',
        id: inv.data.id,
        sourceFile: inv.sourceFile,
        sourceRow: inv.sourceRow,
      })
    } else {
      seen.set(key, [inv])
    }
  }

  if (dupes.length === 0) return []

  return [
    {
      ruleId: 'invoice.duplicate',
      severity: 'warning',
      title: `${dupes.length} duplicate invoice row(s)`,
      explanation: 'Multiple rows share the same invoice identifier.',
      affectedRecords: dupes.slice(0, 50),
      sourceFiles: [...new Set(dupes.map((d) => d.sourceFile))],
      suggestedAction: 'Check for duplicate exports or re-export invoices.',
      category: 'invoice',
    },
  ]
}

export function ruleMissingInvoiceIds(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const missing = context.archive.invoices.filter((i) => !i.data.id && !i.data.number)

  if (missing.length === 0) return []

  return [
    {
      ruleId: 'invoice.missing_identifier',
      severity: 'critical',
      title: `${missing.length} invoice(s) with blank identifier`,
      explanation: 'These invoice rows have no invoice ID or number.',
      affectedRecords: missing.slice(0, 50).map((i) => ({
        label: `Row ${i.sourceRow}`,
        sourceFile: i.sourceFile,
        sourceRow: i.sourceRow,
      })),
      sourceFiles: [...new Set(missing.map((m) => m.sourceFile))],
      suggestedAction: 'Re-export invoices from Harvest.',
      category: 'invoice',
    },
  ]
}

export function ruleInvoiceLineItemTotals(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const lineItemsByInvoice = new Map<string, typeof context.archive.invoiceLineItems>()

  for (const item of context.archive.invoiceLineItems) {
    const key = invoiceKey(item.data.invoiceId, item.data.invoiceNumber)
    const list = lineItemsByInvoice.get(key) ?? []
    list.push(item)
    lineItemsByInvoice.set(key, list)
  }

  for (const inv of context.archive.invoices) {
    const key = invoiceKey(inv.data.id, inv.data.number)
    const items = lineItemsByInvoice.get(key)
    if (!items || items.length === 0) continue

    const currency = inv.data.currency ?? 'UNKNOWN'
    const lineTotal = items
      .filter((i) => (i.data.currency ?? 'UNKNOWN') === currency)
      .reduce((sum, i) => sum + i.data.amount, 0)

    const diff = Math.abs(lineTotal - inv.data.amount)
    if (diff > 0.01) {
      findings.push({
        ruleId: 'invoice.total_mismatch',
        severity: 'warning',
        title: `Invoice total mismatch: ${inv.data.number ?? inv.data.id}`,
        explanation: `Invoice amount (${inv.data.amount} ${currency}) does not match line item total (${lineTotal.toFixed(2)} ${currency}). Difference: ${diff.toFixed(2)}.`,
        affectedRecords: [
          {
            label: inv.data.number ?? inv.data.id ?? 'unknown',
            id: inv.data.id,
            sourceFile: inv.sourceFile,
            sourceRow: inv.sourceRow,
          },
        ],
        sourceFiles: [inv.sourceFile, ...items.map((i) => i.sourceFile)],
        suggestedAction: 'Verify line items export covers the same invoices and currency.',
        category: 'invoice',
      })
    }
  }

  return findings
}

export function rulePaymentReconciliation(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const paymentsByInvoice = new Map<string, typeof context.archive.payments>()

  for (const payment of context.archive.payments) {
    const key = invoiceKey(payment.data.invoiceId, payment.data.invoiceNumber)
    const list = paymentsByInvoice.get(key) ?? []
    list.push(payment)
    paymentsByInvoice.set(key, list)
  }

  for (const inv of context.archive.invoices) {
    const key = invoiceKey(inv.data.id, inv.data.number)
    const payments = paymentsByInvoice.get(key) ?? []
    if (payments.length === 0) continue

    const currency = inv.data.currency ?? 'UNKNOWN'
    const paidTotal = payments
      .filter((p) => (p.data.currency ?? 'UNKNOWN') === currency)
      .reduce((sum, p) => sum + p.data.amount, 0)

    const diff = inv.data.amount - paidTotal
    if (Math.abs(diff) > 0.01) {
      const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : ''
      findings.push({
        ruleId: 'invoice.payment_discrepancy',
        severity: Math.abs(diff) > inv.data.amount * 0.1 ? 'warning' : 'info',
        title: `${symbol}${Math.abs(diff).toFixed(2)} payment discrepancy – ${inv.data.number ?? inv.data.id}`,
        explanation: `Invoice total: ${inv.data.amount} ${currency}. Payments recorded: ${paidTotal.toFixed(2)} ${currency}. Difference: ${diff.toFixed(2)} ${currency}.`,
        affectedRecords: [
          { label: inv.data.number ?? inv.data.id ?? '', sourceFile: inv.sourceFile },
          ...payments.map((p) => ({
            label: `Payment ${p.data.amount}`,
            sourceFile: p.sourceFile,
            sourceRow: p.sourceRow,
          })),
        ],
        sourceFiles: [inv.sourceFile, ...payments.map((p) => p.sourceFile)],
        suggestedAction: diff > 0 ? 'Verify all payments were exported.' : 'Check for overpayments or currency mismatches.',
        category: 'invoice',
      })
    }
  }

  return findings
}

export function ruleOverpayments(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []

  for (const inv of context.archive.invoices) {
    const invKeys = buildInvoiceKeySet([inv])
    const payments = context.archive.payments.filter((p) =>
      matchesInvoiceKey(invKeys, p.data.invoiceId, p.data.invoiceNumber),
    )
    if (payments.length === 0) continue

    const currency = inv.data.currency ?? 'UNKNOWN'
    const paidTotal = payments
      .filter((p) => (p.data.currency ?? 'UNKNOWN') === currency)
      .reduce((sum, p) => sum + p.data.amount, 0)

    if (paidTotal > inv.data.amount + 0.01) {
      findings.push({
        ruleId: 'invoice.overpayment',
        severity: 'warning',
        title: `Overpayment on ${inv.data.number ?? inv.data.id}`,
        explanation: `Payments (${paidTotal.toFixed(2)} ${currency}) exceed invoice total (${inv.data.amount} ${currency}).`,
        affectedRecords: payments.map((p) => ({
          label: `${p.data.amount} ${p.data.currency ?? currency}`,
          sourceFile: p.sourceFile,
          sourceRow: p.sourceRow,
        })),
        sourceFiles: [...new Set(payments.map((p) => p.sourceFile))],
        suggestedAction: 'Review payment records for duplicates or currency errors.',
        category: 'invoice',
      })
    }
  }

  return findings
}

export function ruleMissingInvoicePdfs(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const pdfNumbers = new Set(
    context.archive.invoicePdfs.map((p) => p.linkedNumber?.toLowerCase()).filter(Boolean) as string[],
  )

  const missing: AuditFinding['affectedRecords'] = []
  for (const inv of context.archive.invoices) {
    const num = inv.data.number
    if (!num) continue
    if (!pdfNumbers.has(num.toLowerCase())) {
      missing.push({
        label: num,
        id: inv.data.id,
        sourceFile: inv.sourceFile,
      })
    }
  }

  if (missing.length === 0) return []

  return [
    {
      ruleId: 'invoice.missing_pdf',
      severity: 'warning',
      title: `${missing.length} invoice PDF(s) appear to be missing`,
      explanation: 'Invoices in the report do not have a matching PDF file.',
      affectedRecords: missing.slice(0, 50),
      sourceFiles: [],
      suggestedAction: 'Download missing invoice PDFs from Harvest before cancelling.',
      category: 'invoice',
    },
  ]
}

export function ruleUnexpectedCurrency(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const knownCurrencies = new Set<string>()
  for (const inv of context.archive.invoices) {
    if (inv.data.currency) knownCurrencies.add(inv.data.currency)
  }

  const unexpected: AuditFinding['affectedRecords'] = []
  const validPattern = /^[A-Z]{3}$/

  for (const inv of context.archive.invoices) {
    const cur = inv.data.currency
    if (cur && !validPattern.test(cur)) {
      unexpected.push({
        label: `${inv.data.number ?? inv.data.id}: ${cur}`,
        sourceFile: inv.sourceFile,
        sourceRow: inv.sourceRow,
      })
    }
  }

  if (unexpected.length === 0) return []

  return [
    {
      ruleId: 'invoice.unexpected_currency',
      severity: 'warning',
      title: `${unexpected.length} record(s) with unexpected currency format`,
      explanation: 'Currency values should be 3-letter ISO codes (e.g. GBP, USD, EUR).',
      affectedRecords: unexpected.slice(0, 50),
      sourceFiles: [...new Set(unexpected.map((u) => u.sourceFile))],
      suggestedAction: 'Verify currency values in the source export.',
      category: 'invoice',
    },
  ]
}

export function ruleCrossCurrencyAggregation(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const currencies = groupByCurrency(context.archive.invoices)
  if (currencies.size <= 1) return []

  return [
    {
      ruleId: 'invoice.multi_currency',
      severity: 'info',
      title: `Invoices span ${currencies.size} currencies`,
      explanation: `Found invoices in: ${[...currencies.keys()].join(', ')}. Totals are not aggregated across currencies.`,
      affectedRecords: [],
      sourceFiles: [],
      suggestedAction: 'Review each currency separately when reconciling.',
      category: 'invoice',
    },
  ]
}

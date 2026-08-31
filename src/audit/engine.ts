import type { AuditContext, AuditFinding, AuditResult, AuditRule } from '../types/audit'
import type { NormalisedArchive } from '../types/models'
import { EXPORT_CATEGORIES, type ExportCategory } from '../types/export-types'
import {
  ruleDuplicateFiles,
  ruleMissingExports,
  ruleSuspiciouslyEmpty,
  ruleUnknownFiles,
} from './rules/completeness'
import {
  ruleExpenseProjectRef,
  ruleLineItemInvoiceRef,
  ruleMissingProject,
  rulePaymentInvoiceRef,
  ruleProjectClientRef,
  ruleTimeEntryProjectRef,
  ruleTimeEntryTaskRef,
} from './rules/integrity'
import {
  ruleCrossCurrencyAggregation,
  ruleDuplicateInvoices,
  ruleInvoiceLineItemTotals,
  ruleMissingInvoiceIds,
  ruleMissingInvoicePdfs,
  ruleOverpayments,
  rulePaymentReconciliation,
  ruleUnexpectedCurrency,
} from './rules/invoice'
import {
  ruleDuplicateEstimates,
  ruleMalformedEstimateIds,
  ruleMissingEstimatePdfs,
} from './rules/estimate'
import {
  ruleBlankIdentifiers,
  ruleDuplicateTimeEntries,
  ruleInconsistentClientNaming,
  ruleUnparseableDates,
} from './rules/quality'
import { getBlindSpots } from './blind-spots'
import { calculateReadinessScore } from '../scoring/readiness'

export const AUDIT_RULES: AuditRule[] = [
  { id: 'archive.missing_export', name: 'Missing exports', category: 'completeness', run: ruleMissingExports },
  { id: 'quality.unknown_files', name: 'Unknown files', category: 'quality', run: ruleUnknownFiles },
  { id: 'quality.duplicate_files', name: 'Duplicate files', category: 'quality', run: ruleDuplicateFiles },
  { id: 'quality.empty_export', name: 'Empty exports', category: 'quality', run: ruleSuspiciouslyEmpty },
  { id: 'integrity.time_missing_project', name: 'Time → project', category: 'integrity', run: ruleTimeEntryProjectRef },
  { id: 'integrity.time_missing_task', name: 'Time → task', category: 'integrity', run: ruleTimeEntryTaskRef },
  { id: 'integrity.expense_missing_project', name: 'Expense → project', category: 'integrity', run: ruleExpenseProjectRef },
  { id: 'integrity.project_missing_client', name: 'Project → client', category: 'integrity', run: ruleProjectClientRef },
  { id: 'integrity.line_item_missing_invoice', name: 'Line item → invoice', category: 'integrity', run: ruleLineItemInvoiceRef },
  { id: 'integrity.payment_missing_invoice', name: 'Payment → invoice', category: 'integrity', run: rulePaymentInvoiceRef },
  { id: 'integrity.missing_project', name: 'Missing projects', category: 'integrity', run: ruleMissingProject },
  { id: 'invoice.duplicate', name: 'Duplicate invoices', category: 'invoice', run: ruleDuplicateInvoices },
  { id: 'invoice.missing_identifier', name: 'Missing invoice IDs', category: 'invoice', run: ruleMissingInvoiceIds },
  { id: 'invoice.total_mismatch', name: 'Invoice total mismatch', category: 'invoice', run: ruleInvoiceLineItemTotals },
  { id: 'invoice.payment_discrepancy', name: 'Payment discrepancy', category: 'invoice', run: rulePaymentReconciliation },
  { id: 'invoice.overpayment', name: 'Overpayments', category: 'invoice', run: ruleOverpayments },
  { id: 'invoice.missing_pdf', name: 'Missing invoice PDFs', category: 'invoice', run: ruleMissingInvoicePdfs },
  { id: 'invoice.unexpected_currency', name: 'Unexpected currency', category: 'invoice', run: ruleUnexpectedCurrency },
  { id: 'invoice.multi_currency', name: 'Multi-currency', category: 'invoice', run: ruleCrossCurrencyAggregation },
  { id: 'estimate.duplicate', name: 'Duplicate estimates', category: 'estimate', run: ruleDuplicateEstimates },
  { id: 'estimate.missing_pdf', name: 'Missing estimate PDFs', category: 'estimate', run: ruleMissingEstimatePdfs },
  { id: 'estimate.malformed_id', name: 'Malformed estimate IDs', category: 'estimate', run: ruleMalformedEstimateIds },
  { id: 'quality.duplicate_time_entry', name: 'Duplicate time entries', category: 'quality', run: ruleDuplicateTimeEntries },
  { id: 'quality.invalid_date', name: 'Invalid dates', category: 'quality', run: ruleUnparseableDates },
  { id: 'quality.blank_identifier', name: 'Blank identifiers', category: 'quality', run: ruleBlankIdentifiers },
  { id: 'quality.inconsistent_client_naming', name: 'Client naming', category: 'quality', run: ruleInconsistentClientNaming },
]

function getPresentCategories(archive: NormalisedArchive): ExportCategory[] {
  const present: ExportCategory[] = []
  if (archive.timeEntries.length > 0) present.push('time_entries')
  if (archive.projects.length > 0) present.push('projects')
  if (archive.clients.length > 0) present.push('clients')
  if (archive.contacts.length > 0) present.push('contacts')
  if (archive.tasks.length > 0) present.push('tasks')
  if (archive.people.length > 0) present.push('people')
  if (archive.expenses.length > 0) present.push('expenses')
  if (archive.invoices.length > 0) present.push('invoices')
  if (archive.invoiceLineItems.length > 0) present.push('invoice_line_items')
  if (archive.payments.length > 0) present.push('payments')
  if (archive.invoicePdfs.length > 0) present.push('invoice_pdfs')
  if (archive.estimates.length > 0) present.push('estimates')
  if (archive.estimatePdfs.length > 0) present.push('estimate_pdfs')

  for (const f of archive.detectedFiles) {
    if (!present.includes(f.category) && f.category !== 'unknown') {
      present.push(f.category)
    }
  }

  return present
}

function buildSummary(archive: NormalisedArchive) {
  return {
    timeEntries: archive.timeEntries.length,
    projects: archive.projects.length,
    clients: archive.clients.length,
    contacts: archive.contacts.length,
    tasks: archive.tasks.length,
    people: archive.people.length,
    expenses: archive.expenses.length,
    invoices: archive.invoices.length,
    invoiceLineItems: archive.invoiceLineItems.length,
    payments: archive.payments.length,
    invoicePdfs: archive.invoicePdfs.length,
    estimates: archive.estimates.length,
    estimatePdfs: archive.estimatePdfs.length,
    unknownFiles: archive.unknownFiles.length,
  }
}

export function runAudit(archive: NormalisedArchive): AuditResult {
  const presentCategories = getPresentCategories(archive)
  const missingCategories = EXPORT_CATEGORIES.filter((c) => !presentCategories.includes(c))

  const context: AuditContext = {
    archive,
    presentCategories,
    missingCategories,
  }

  const findings: AuditFinding[] = []
  for (const rule of AUDIT_RULES) {
    findings.push(...rule.run(context))
  }

  const blindSpots = getBlindSpots()
  const readiness = calculateReadinessScore(findings)

  return {
    findings,
    blindSpots,
    summary: buildSummary(archive),
    readiness,
    presentCategories,
    missingCategories,
  }
}

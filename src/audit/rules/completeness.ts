import type { AuditContext, AuditFinding } from '../../types/audit'
import { EXPORT_CATEGORY_LABELS } from '../../types/export-types'
import type { ExportCategory } from '../../types/export-types'

const CRITICAL_MISSING: ExportCategory[] = ['time_entries', 'projects', 'clients', 'invoices']
const IMPORTANT_MISSING: ExportCategory[] = ['payments', 'expenses', 'people', 'invoice_line_items']
const OPTIONAL_MISSING: ExportCategory[] = ['contacts', 'tasks', 'estimates', 'estimate_pdfs', 'invoice_pdfs']

export function ruleMissingExports(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const { missingCategories, archive } = context

  for (const cat of missingCategories) {
    if (!CRITICAL_MISSING.includes(cat) && !IMPORTANT_MISSING.includes(cat) && !OPTIONAL_MISSING.includes(cat)) {
      continue
    }

    let severity: AuditFinding['severity'] = 'info'
    let suggestedAction = `Export ${EXPORT_CATEGORY_LABELS[cat]} from Harvest if you use this feature.`

    if (CRITICAL_MISSING.includes(cat)) {
      severity = 'critical'
      suggestedAction = `Obtain a ${EXPORT_CATEGORY_LABELS[cat]} export from Harvest before cancelling.`
    } else if (IMPORTANT_MISSING.includes(cat)) {
      if (cat === 'payments' && archive.invoices.length > 0) {
        severity = 'warning'
        suggestedAction = 'Export payments from Harvest to verify invoice reconciliation.'
      } else if (cat === 'expenses' && archive.expenses.length === 0) {
        severity = 'warning'
      } else if (cat === 'invoice_line_items' && archive.invoices.length > 0) {
        severity = 'warning'
        suggestedAction = 'Export invoice line items to verify invoice totals.'
      } else {
        severity = 'info'
      }
    }

    if (cat === 'invoice_pdfs' && archive.invoices.length > 0) {
      severity = 'warning'
      suggestedAction = 'Download invoice PDFs from Harvest for your records.'
    }

    findings.push({
      ruleId: 'archive.missing_export',
      severity,
      title: `Missing ${EXPORT_CATEGORY_LABELS[cat]} export`,
      explanation: `No file was detected for ${EXPORT_CATEGORY_LABELS[cat]}.`,
      affectedRecords: [],
      sourceFiles: [],
      suggestedAction,
      category: 'completeness',
    })
  }

  return findings
}

export function ruleUnknownFiles(context: AuditContext): AuditFinding[] {
  if (context.archive.unknownFiles.length === 0) return []

  return [
    {
      ruleId: 'quality.unknown_files',
      severity: 'warning',
      title: `${context.archive.unknownFiles.length} unrecognised file(s)`,
      explanation: 'These files could not be classified as a known Harvest export type.',
      affectedRecords: context.archive.unknownFiles.map((f) => ({ label: f, sourceFile: f })),
      sourceFiles: context.archive.unknownFiles,
      suggestedAction: 'Review these files manually. They may be non-Harvest documents or use an export format not yet supported.',
      category: 'quality',
    },
  ]
}

export function ruleDuplicateFiles(context: AuditContext): AuditFinding[] {
  const dupes = context.archive.detectedFiles.filter((f) => f.isDuplicate)
  if (dupes.length === 0) return []

  return [
    {
      ruleId: 'quality.duplicate_files',
      severity: 'info',
      title: `${dupes.length} duplicate file(s) uploaded`,
      explanation: 'The same filename was uploaded more than once. Only the first occurrence was processed.',
      affectedRecords: dupes.map((f) => ({
        label: f.filename,
        sourceFile: f.filename,
      })),
      sourceFiles: dupes.map((f) => f.filename),
      suggestedAction: 'Remove duplicate uploads if unintentional.',
      category: 'quality',
    },
  ]
}

export function ruleSuspiciouslyEmpty(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = []
  const checks: Array<{ count: number; label: string; category: ExportCategory }> = [
    { count: context.archive.timeEntries.length, label: 'time entries', category: 'time_entries' },
    { count: context.archive.invoices.length, label: 'invoices', category: 'invoices' },
    { count: context.archive.projects.length, label: 'projects', category: 'projects' },
  ]

  for (const check of checks) {
    if (context.presentCategories.includes(check.category) && check.count === 0) {
      findings.push({
        ruleId: 'quality.empty_export',
        severity: 'warning',
        title: `Empty ${check.label} export`,
        explanation: `A ${check.label} file was detected but contained no data rows.`,
        affectedRecords: [],
        sourceFiles: context.archive.detectedFiles
          .filter((f) => f.category === check.category)
          .map((f) => f.filename),
        suggestedAction: 'Re-export from Harvest and verify the date range and filters.',
        category: 'quality',
      })
    }
  }

  return findings
}

import type { AuditFinding } from '../../types/audit'
import {
  buildInvoiceKeySet,
  buildProjectKeySet,
  buildTaskKeySet,
  clientKey,
  matchesInvoiceKey,
  matchesProjectKey,
  matchesTaskKey,
} from '../keys'

export function ruleTimeEntryProjectRef(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const projectKeys = buildProjectKeySet(context.archive.projects)
  const missing: AuditFinding['affectedRecords'] = []

  for (const entry of context.archive.timeEntries) {
    if (!matchesProjectKey(projectKeys, entry.data.projectId, entry.data.projectName)) {
      if (!entry.data.projectId && !entry.data.projectName) continue
      missing.push({
        label: `${entry.data.date} – ${entry.data.projectName ?? entry.data.projectId}`,
        id: entry.data.id,
        sourceFile: entry.sourceFile,
        sourceRow: entry.sourceRow,
      })
    }
  }

  if (missing.length === 0) return []

  return [
    {
      ruleId: 'integrity.time_missing_project',
      severity: 'critical',
      title: `${missing.length} time entr${missing.length === 1 ? 'y' : 'ies'} reference missing project`,
      explanation: 'These time entries point to a project not found in the projects export.',
      affectedRecords: missing.slice(0, 50),
      sourceFiles: [...new Set(missing.map((m) => m.sourceFile))],
      suggestedAction: 'Export projects from Harvest or verify project names/IDs match.',
      category: 'integrity',
    },
  ]
}

export function ruleTimeEntryTaskRef(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const taskKeys = buildTaskKeySet(context.archive.tasks)
  const missing: AuditFinding['affectedRecords'] = []

  for (const entry of context.archive.timeEntries) {
    if (!entry.data.taskId && !entry.data.taskName) continue
    if (!matchesTaskKey(taskKeys, entry.data.taskId, entry.data.taskName)) {
      missing.push({
        label: `${entry.data.taskName ?? entry.data.taskId}`,
        id: entry.data.id,
        sourceFile: entry.sourceFile,
        sourceRow: entry.sourceRow,
      })
    }
  }

  if (missing.length === 0) return []

  return [
    {
      ruleId: 'integrity.time_missing_task',
      severity: 'warning',
      title: `${missing.length} time entr${missing.length === 1 ? 'y' : 'ies'} reference missing task`,
      explanation: 'These time entries reference a task not found in the tasks export.',
      affectedRecords: missing.slice(0, 50),
      sourceFiles: [...new Set(missing.map((m) => m.sourceFile))],
      suggestedAction: 'Export tasks from Harvest or verify task names/IDs.',
      category: 'integrity',
    },
  ]
}

export function ruleExpenseProjectRef(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const projectKeys = buildProjectKeySet(context.archive.projects)
  const missing: AuditFinding['affectedRecords'] = []

  for (const expense of context.archive.expenses) {
    if (!expense.data.projectId && !expense.data.projectName) continue
    if (!matchesProjectKey(projectKeys, expense.data.projectId, expense.data.projectName)) {
      missing.push({
        label: `${expense.data.date} – ${expense.data.projectName ?? expense.data.projectId}`,
        id: expense.data.id,
        sourceFile: expense.sourceFile,
        sourceRow: expense.sourceRow,
      })
    }
  }

  if (missing.length === 0) return []

  return [
    {
      ruleId: 'integrity.expense_missing_project',
      severity: 'warning',
      title: `${missing.length} expense(s) reference missing project`,
      explanation: 'These expenses point to a project not found in the projects export.',
      affectedRecords: missing.slice(0, 50),
      sourceFiles: [...new Set(missing.map((m) => m.sourceFile))],
      suggestedAction: 'Verify project exports include all referenced projects.',
      category: 'integrity',
    },
  ]
}

export function ruleProjectClientRef(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const clientIds = new Set(
    context.archive.clients.map((c) => clientKey(c.data.id, c.data.name)).filter(Boolean) as string[],
  )
  const missing: AuditFinding['affectedRecords'] = []

  for (const project of context.archive.projects) {
    const key = clientKey(project.data.clientId, project.data.clientName)
    if (key && !clientIds.has(key)) {
      missing.push({
        label: project.data.name,
        id: project.data.id,
        sourceFile: project.sourceFile,
        sourceRow: project.sourceRow,
      })
    }
  }

  if (missing.length === 0) return []

  return [
    {
      ruleId: 'integrity.project_missing_client',
      severity: 'warning',
      title: `${missing.length} project(s) reference missing client`,
      explanation: 'These projects reference a client not found in the clients export.',
      affectedRecords: missing.slice(0, 50),
      sourceFiles: [...new Set(missing.map((m) => m.sourceFile))],
      suggestedAction: 'Export clients from Harvest and verify naming consistency.',
      category: 'integrity',
    },
  ]
}

export function ruleLineItemInvoiceRef(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const invoiceKeys = buildInvoiceKeySet(context.archive.invoices)
  const missing: AuditFinding['affectedRecords'] = []

  for (const item of context.archive.invoiceLineItems) {
    if (!matchesInvoiceKey(invoiceKeys, item.data.invoiceId, item.data.invoiceNumber)) {
      missing.push({
        label: item.data.invoiceNumber ?? item.data.invoiceId ?? 'unknown',
        id: item.data.id,
        sourceFile: item.sourceFile,
        sourceRow: item.sourceRow,
      })
    }
  }

  if (missing.length === 0) return []

  return [
    {
      ruleId: 'integrity.line_item_missing_invoice',
      severity: 'critical',
      title: `${missing.length} line item(s) reference unknown invoice`,
      explanation: 'Invoice line items point to invoices not found in the invoice report.',
      affectedRecords: missing.slice(0, 50),
      sourceFiles: [...new Set(missing.map((m) => m.sourceFile))],
      suggestedAction: 'Re-export invoices and line items with matching date ranges.',
      category: 'integrity',
    },
  ]
}

export function rulePaymentInvoiceRef(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const invoiceKeys = buildInvoiceKeySet(context.archive.invoices)
  const missing: AuditFinding['affectedRecords'] = []

  for (const payment of context.archive.payments) {
    if (!matchesInvoiceKey(invoiceKeys, payment.data.invoiceId, payment.data.invoiceNumber)) {
      missing.push({
        label: payment.data.invoiceNumber ?? payment.data.invoiceId ?? 'unknown',
        id: payment.data.id,
        sourceFile: payment.sourceFile,
        sourceRow: payment.sourceRow,
      })
    }
  }

  if (missing.length === 0) return []

  return [
    {
      ruleId: 'integrity.payment_missing_invoice',
      severity: 'critical',
      title: `${missing.length} payment(s) reference unknown invoice`,
      explanation: 'Payments point to invoices not found in the invoice report.',
      affectedRecords: missing.slice(0, 50),
      sourceFiles: [...new Set(missing.map((m) => m.sourceFile))],
      suggestedAction: 'Re-export payments and invoices with matching identifiers.',
      category: 'integrity',
    },
  ]
}

export function ruleMissingProject(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const projectNames = new Set(context.archive.projects.map((p) => p.data.name.toLowerCase()))
  const referenced = new Set<string>()

  for (const entry of context.archive.timeEntries) {
    if (entry.data.projectName) referenced.add(entry.data.projectName.toLowerCase())
  }

  const missing = [...referenced].filter((name) => !projectNames.has(name))
  if (missing.length === 0) return []

  return [
    {
      ruleId: 'integrity.missing_project',
      severity: 'critical',
      title: `${missing.length} referenced project(s) missing from export`,
      explanation: 'Time entries reference projects that do not appear in the projects export.',
      affectedRecords: missing.map((name) => ({ label: name, sourceFile: '' })),
      sourceFiles: [],
      suggestedAction: 'Export all projects from Harvest, including archived ones.',
      category: 'integrity',
    },
  ]
}

import type { ExportCategory } from '../types/export-types'
import { EXPORT_CATEGORY_LABELS } from '../types/export-types'

export const CHECKLIST_ITEMS: Array<{
  category: ExportCategory
  description: string
  importance: 'critical' | 'important' | 'optional'
}> = [
  {
    category: 'time_entries',
    description: 'All tracked hours, billable status, and notes',
    importance: 'critical',
  },
  {
    category: 'projects',
    description: 'Project names, codes, clients, and budgets',
    importance: 'critical',
  },
  {
    category: 'clients',
    description: 'Client names, addresses, and currency settings',
    importance: 'critical',
  },
  {
    category: 'contacts',
    description: 'Client contact people and email addresses',
    importance: 'optional',
  },
  {
    category: 'tasks',
    description: 'Task definitions linked to projects',
    importance: 'optional',
  },
  {
    category: 'people',
    description: 'Team members, roles, and rates',
    importance: 'important',
  },
  {
    category: 'expenses',
    description: 'Expense records with amounts and projects',
    importance: 'important',
  },
  {
    category: 'invoices',
    description: 'Invoice report with amounts, dates, and status',
    importance: 'critical',
  },
  {
    category: 'invoice_line_items',
    description: 'Line-level detail for each invoice',
    importance: 'important',
  },
  {
    category: 'payments',
    description: 'Payment records linked to invoices',
    importance: 'important',
  },
  {
    category: 'invoice_pdfs',
    description: 'PDF copies of sent invoices',
    importance: 'optional',
  },
  {
    category: 'estimates',
    description: 'Estimate records with amounts and status',
    importance: 'optional',
  },
  {
    category: 'estimate_pdfs',
    description: 'PDF copies of estimates',
    importance: 'optional',
  },
]

export function getCategoryLabel(category: ExportCategory): string {
  return EXPORT_CATEGORY_LABELS[category]
}

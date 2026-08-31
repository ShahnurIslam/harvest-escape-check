export type ExportCategory =
  | 'time_entries'
  | 'projects'
  | 'clients'
  | 'contacts'
  | 'tasks'
  | 'people'
  | 'expenses'
  | 'invoices'
  | 'invoice_line_items'
  | 'payments'
  | 'invoice_pdfs'
  | 'estimates'
  | 'estimate_pdfs'
  | 'unknown'

export const EXPORT_CATEGORIES: ExportCategory[] = [
  'time_entries',
  'projects',
  'clients',
  'contacts',
  'tasks',
  'people',
  'expenses',
  'invoices',
  'invoice_line_items',
  'payments',
  'invoice_pdfs',
  'estimates',
  'estimate_pdfs',
]

export const EXPORT_CATEGORY_LABELS: Record<ExportCategory, string> = {
  time_entries: 'Time entries',
  projects: 'Projects',
  clients: 'Clients',
  contacts: 'Client contacts',
  tasks: 'Tasks',
  people: 'People / team',
  expenses: 'Expenses',
  invoices: 'Invoice report',
  invoice_line_items: 'Invoice line items',
  payments: 'Payments',
  invoice_pdfs: 'Invoice PDFs',
  estimates: 'Estimates',
  estimate_pdfs: 'Estimate PDFs',
  unknown: 'Unknown',
}

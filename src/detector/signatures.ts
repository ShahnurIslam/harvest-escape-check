import type { ExportCategory } from '../types/export-types'

export interface HeaderSignature {
  category: ExportCategory
  requiredHeaders: string[]
  optionalHeaders?: string[]
  minMatchRatio?: number
}

/** Header signatures inferred from public Harvest export documentation. */
export const HEADER_SIGNATURES: HeaderSignature[] = [
  {
    category: 'time_entries',
    requiredHeaders: ['date', 'hours'],
    optionalHeaders: [
      'client',
      'project',
      'task',
      'notes',
      'billable',
      'billable?',
      'first name',
      'last name',
      'employee id',
      'employee?',
      'billable rate',
      'currency',
    ],
    minMatchRatio: 0.5,
  },
  {
    category: 'projects',
    requiredHeaders: ['project', 'client'],
    optionalHeaders: ['code', 'bill by', 'budget', 'notes', 'active', 'currency'],
    minMatchRatio: 0.5,
  },
  {
    category: 'clients',
    requiredHeaders: ['client'],
    optionalHeaders: ['address', 'currency', 'country', 'state', 'zip', 'city'],
    minMatchRatio: 0.4,
  },
  {
    category: 'contacts',
    requiredHeaders: ['client'],
    optionalHeaders: ['first name', 'last name', 'email', 'phone', 'title'],
    minMatchRatio: 0.5,
  },
  {
    category: 'tasks',
    requiredHeaders: ['task'],
    optionalHeaders: ['project', 'client', 'billable by default'],
    minMatchRatio: 0.5,
  },
  {
    category: 'people',
    requiredHeaders: ['first name', 'last name'],
    optionalHeaders: ['email', 'role', 'employee id', 'employee?', 'cost rate', 'billable rate'],
    minMatchRatio: 0.5,
  },
  {
    category: 'expenses',
    requiredHeaders: ['amount'],
    optionalHeaders: ['date', 'spent date', 'project', 'client', 'notes', 'category', 'units', 'currency', 'billable'],
    minMatchRatio: 0.4,
  },
  {
    category: 'invoices',
    requiredHeaders: ['amount'],
    optionalHeaders: [
      'invoice id',
      'invoice number',
      'client',
      'issue date',
      'due date',
      'status',
      'currency',
      'subject',
    ],
    minMatchRatio: 0.4,
  },
  {
    category: 'invoice_line_items',
    requiredHeaders: ['amount'],
    optionalHeaders: [
      'invoice id',
      'invoice number',
      'description',
      'quantity',
      'unit price',
      'type',
      'currency',
    ],
    minMatchRatio: 0.4,
  },
  {
    category: 'payments',
    requiredHeaders: ['amount'],
    optionalHeaders: ['invoice id', 'invoice number', 'paid date', 'payment date', 'currency', 'notes'],
    minMatchRatio: 0.4,
  },
  {
    category: 'estimates',
    requiredHeaders: ['amount'],
    optionalHeaders: ['estimate id', 'estimate number', 'client', 'issue date', 'status', 'currency'],
    minMatchRatio: 0.4,
  },
]

export const FILENAME_PATTERNS: Array<{ pattern: RegExp; category: ExportCategory }> = [
  { pattern: /time[_\s-]?entr/i, category: 'time_entries' },
  { pattern: /timesheet/i, category: 'time_entries' },
  { pattern: /project/i, category: 'projects' },
  { pattern: /client[_\s-]?contact/i, category: 'contacts' },
  { pattern: /contact/i, category: 'contacts' },
  { pattern: /client/i, category: 'clients' },
  { pattern: /task/i, category: 'tasks' },
  { pattern: /people|team|user/i, category: 'people' },
  { pattern: /expense/i, category: 'expenses' },
  { pattern: /invoice[_\s-]?line/i, category: 'invoice_line_items' },
  { pattern: /line[_\s-]?item/i, category: 'invoice_line_items' },
  { pattern: /invoice/i, category: 'invoices' },
  { pattern: /payment/i, category: 'payments' },
  { pattern: /estimate/i, category: 'estimates' },
]

export const PDF_PATTERNS: Array<{ pattern: RegExp; category: ExportCategory }> = [
  { pattern: /^INV[-_]?\d+/i, category: 'invoice_pdfs' },
  { pattern: /^invoice[-_]\d+/i, category: 'invoice_pdfs' },
  { pattern: /invoice.*\.pdf$/i, category: 'invoice_pdfs' },
  { pattern: /^EST[-_]?\d+/i, category: 'estimate_pdfs' },
  { pattern: /^estimate[-_]\d+/i, category: 'estimate_pdfs' },
  { pattern: /estimate.*\.pdf$/i, category: 'estimate_pdfs' },
]

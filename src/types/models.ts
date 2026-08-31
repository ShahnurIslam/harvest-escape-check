import type { ExportCategory } from './export-types'

export interface SourceRef {
  sourceFile: string
  sourceRow?: number
}

export interface ParsingWarning {
  message: string
  sourceFile: string
  sourceRow?: number
}

export interface ParsedRecord<T> extends SourceRef {
  data: T
  warnings: ParsingWarning[]
}

export interface TimeEntry {
  id?: string
  date: string
  clientId?: string
  clientName?: string
  projectId?: string
  projectName?: string
  taskId?: string
  taskName?: string
  personId?: string
  personName?: string
  hours: number
  billable?: boolean
  notes?: string
  currency?: string
}

export interface Project {
  id?: string
  name: string
  clientId?: string
  clientName?: string
  code?: string
  active?: boolean
  currency?: string
}

export interface Client {
  id?: string
  name: string
  currency?: string
  address?: string
}

export interface Contact {
  id?: string
  clientId?: string
  clientName?: string
  firstName?: string
  lastName?: string
  email?: string
}

export interface Task {
  id?: string
  name: string
  projectId?: string
  projectName?: string
}

export interface Person {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
}

export interface Expense {
  id?: string
  date: string
  projectId?: string
  projectName?: string
  clientId?: string
  clientName?: string
  amount: number
  currency?: string
  notes?: string
}

export interface Invoice {
  id?: string
  number?: string
  clientId?: string
  clientName?: string
  issueDate?: string
  dueDate?: string
  amount: number
  currency?: string
  status?: string
}

export interface InvoiceLineItem {
  id?: string
  invoiceId?: string
  invoiceNumber?: string
  description?: string
  quantity?: number
  unitPrice?: number
  amount: number
  currency?: string
}

export interface Payment {
  id?: string
  invoiceId?: string
  invoiceNumber?: string
  amount: number
  currency?: string
  paidDate?: string
  notes?: string
}

export interface Estimate {
  id?: string
  number?: string
  clientId?: string
  clientName?: string
  issueDate?: string
  amount: number
  currency?: string
  status?: string
}

export interface PdfDocument {
  filename: string
  documentType: 'invoice_pdf' | 'estimate_pdf'
  linkedId?: string
  linkedNumber?: string
}

export interface DetectedFile {
  filename: string
  mimeType: string
  category: ExportCategory
  confidence: 'high' | 'medium' | 'low'
  detectionMethod: string
  isDuplicate: boolean
  duplicateOf?: string
}

export interface UploadedFile {
  filename: string
  mimeType: string
  content: ArrayBuffer
  textContent?: string
}

export interface NormalisedArchive {
  timeEntries: ParsedRecord<TimeEntry>[]
  projects: ParsedRecord<Project>[]
  clients: ParsedRecord<Client>[]
  contacts: ParsedRecord<Contact>[]
  tasks: ParsedRecord<Task>[]
  people: ParsedRecord<Person>[]
  expenses: ParsedRecord<Expense>[]
  invoices: ParsedRecord<Invoice>[]
  invoiceLineItems: ParsedRecord<InvoiceLineItem>[]
  payments: ParsedRecord<Payment>[]
  estimates: ParsedRecord<Estimate>[]
  invoicePdfs: PdfDocument[]
  estimatePdfs: PdfDocument[]
  unknownFiles: string[]
  detectedFiles: DetectedFile[]
  parsingWarnings: ParsingWarning[]
}

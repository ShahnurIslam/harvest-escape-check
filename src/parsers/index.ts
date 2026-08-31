import type { ExportCategory } from '../types/export-types'
import type { DetectedFile, NormalisedArchive, PdfDocument, UploadedFile } from '../types/models'
import {
  parseClients,
  parseContacts,
  parseEstimates,
  parseExpenses,
  parseInvoiceLineItems,
  parseInvoices,
  parsePayments,
  parsePeople,
  parseProjects,
  parseRowsFromFile,
  parseTasks,
  parseTimeEntries,
} from './entity-parsers'

function emptyArchive(): NormalisedArchive {
  return {
    timeEntries: [],
    projects: [],
    clients: [],
    contacts: [],
    tasks: [],
    people: [],
    expenses: [],
    invoices: [],
    invoiceLineItems: [],
    payments: [],
    estimates: [],
    invoicePdfs: [],
    estimatePdfs: [],
    unknownFiles: [],
    detectedFiles: [],
    parsingWarnings: [],
  }
}

function extractPdfInfo(filename: string, category: ExportCategory): PdfDocument | null {
  if (category === 'invoice_pdfs') {
    const invMatch = filename.match(/INV[-_]?(\d+)/i)
    if (invMatch) {
      return {
        filename,
        documentType: 'invoice_pdf',
        linkedNumber: `INV-${invMatch[1]}`,
      }
    }
    const invoiceDashMatch = filename.match(/^invoice[-_](\d+)/i)
    if (invoiceDashMatch) {
      return {
        filename,
        documentType: 'invoice_pdf',
        linkedNumber: invoiceDashMatch[1],
      }
    }
    const invoiceMatch = filename.match(/invoice[-_]?(\d+)/i)
    return {
      filename,
      documentType: 'invoice_pdf',
      linkedNumber: invoiceMatch ? invoiceMatch[1] : undefined,
    }
  }
  if (category === 'estimate_pdfs') {
    const estMatch = filename.match(/EST[-_]?(\d+)/i)
    if (estMatch) {
      return {
        filename,
        documentType: 'estimate_pdf',
        linkedNumber: `EST-${estMatch[1]}`,
      }
    }
    const estimateDashMatch = filename.match(/^estimate[-_](\d+)/i)
    if (estimateDashMatch) {
      return {
        filename,
        documentType: 'estimate_pdf',
        linkedNumber: estimateDashMatch[1],
      }
    }
    const estimateMatch = filename.match(/estimate[-_]?(\d+)/i)
    return {
      filename,
      documentType: 'estimate_pdf',
      linkedNumber: estimateMatch ? `EST-${estimateMatch[1]}` : undefined,
    }
  }
  return null
}

export function parseDetectedFile(
  file: UploadedFile,
  detection: DetectedFile,
  archive: NormalisedArchive,
): NormalisedArchive {
  const category = detection.category

  if (category === 'unknown') {
    archive.unknownFiles.push(file.filename)
    return archive
  }

  if (category === 'invoice_pdfs' || category === 'estimate_pdfs') {
    const pdf = extractPdfInfo(file.filename, category)
    if (pdf) {
      if (category === 'invoice_pdfs') archive.invoicePdfs.push(pdf)
      else archive.estimatePdfs.push(pdf)
    }
    return archive
  }

  const rows = parseRowsFromFile(file.content, file.textContent, file.filename)
  if (rows.length === 0) return archive

  switch (category) {
    case 'time_entries': {
      const parsed = parseTimeEntries(rows, file.filename)
      archive.timeEntries.push(...parsed)
      archive.parsingWarnings.push(...parsed.flatMap((p) => p.warnings))
      break
    }
    case 'projects':
      archive.projects.push(...parseProjects(rows, file.filename))
      break
    case 'clients':
      archive.clients.push(...parseClients(rows, file.filename))
      break
    case 'contacts':
      archive.contacts.push(...parseContacts(rows, file.filename))
      break
    case 'tasks':
      archive.tasks.push(...parseTasks(rows, file.filename))
      break
    case 'people':
      archive.people.push(...parsePeople(rows, file.filename))
      break
    case 'expenses': {
      const parsed = parseExpenses(rows, file.filename)
      archive.expenses.push(...parsed)
      archive.parsingWarnings.push(...parsed.flatMap((p) => p.warnings))
      break
    }
    case 'invoices': {
      const parsed = parseInvoices(rows, file.filename)
      archive.invoices.push(...parsed)
      archive.parsingWarnings.push(...parsed.flatMap((p) => p.warnings))
      break
    }
    case 'invoice_line_items':
      archive.invoiceLineItems.push(...parseInvoiceLineItems(rows, file.filename))
      break
    case 'payments':
      archive.payments.push(...parsePayments(rows, file.filename))
      break
    case 'estimates':
      archive.estimates.push(...parseEstimates(rows, file.filename))
      break
  }

  return archive
}

export function createEmptyArchive(): NormalisedArchive {
  return emptyArchive()
}

export function mergeArchives(a: NormalisedArchive, b: NormalisedArchive): NormalisedArchive {
  return {
    timeEntries: [...a.timeEntries, ...b.timeEntries],
    projects: [...a.projects, ...b.projects],
    clients: [...a.clients, ...b.clients],
    contacts: [...a.contacts, ...b.contacts],
    tasks: [...a.tasks, ...b.tasks],
    people: [...a.people, ...b.people],
    expenses: [...a.expenses, ...b.expenses],
    invoices: [...a.invoices, ...b.invoices],
    invoiceLineItems: [...a.invoiceLineItems, ...b.invoiceLineItems],
    payments: [...a.payments, ...b.payments],
    estimates: [...a.estimates, ...b.estimates],
    invoicePdfs: [...a.invoicePdfs, ...b.invoicePdfs],
    estimatePdfs: [...a.estimatePdfs, ...b.estimatePdfs],
    unknownFiles: [...a.unknownFiles, ...b.unknownFiles],
    detectedFiles: [...a.detectedFiles, ...b.detectedFiles],
    parsingWarnings: [...a.parsingWarnings, ...b.parsingWarnings],
  }
}

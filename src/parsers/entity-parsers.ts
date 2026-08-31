import type { ParsedRecord, TimeEntry } from '../types/models'
import {
  findColumn,
  makeWarning,
  parseBoolean,
  parseCsvRows,
  parseDate,
  parseNumber,
  parseXlsxRows,
  rowNumber,
} from './parser-utils'

export function parseTimeEntries(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<TimeEntry>[] {
  return rows.map((row, index) => {
    const warnings = []
    const dateResult = parseDate(findColumn(row, 'Date', 'date'))
    if (!dateResult.valid) {
      warnings.push(makeWarning('Unparseable date', sourceFile, rowNumber(index)))
    }

    const hours = parseNumber(findColumn(row, 'Hours', 'hours')) ?? 0

    return {
      sourceFile,
      sourceRow: rowNumber(index),
      warnings,
      data: {
        id: findColumn(row, 'Entry Id', 'ID', 'id'),
        date: dateResult.value ?? findColumn(row, 'Date', 'date') ?? '',
        clientId: findColumn(row, 'Client Id', 'client id'),
        clientName: findColumn(row, 'Client', 'client'),
        projectId: findColumn(row, 'Project Id', 'project id'),
        projectName: findColumn(row, 'Project', 'project'),
        taskId: findColumn(row, 'Task Id', 'task id'),
        taskName: findColumn(row, 'Task', 'task'),
        personId: findColumn(row, 'Employee Id', 'employee id', 'User Id'),
        personName: [
          findColumn(row, 'First Name', 'first name'),
          findColumn(row, 'Last Name', 'last name'),
        ]
          .filter(Boolean)
          .join(' ') || findColumn(row, 'User', 'user'),
        hours,
        billable: parseBoolean(findColumn(row, 'Billable?', 'Billable', 'billable')),
        notes: findColumn(row, 'Notes', 'notes'),
        currency: findColumn(row, 'Currency', 'currency'),
      },
    }
  })
}

export function parseProjects(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').Project>[] {
  return rows.map((row, index) => ({
    sourceFile,
    sourceRow: rowNumber(index),
    warnings: [],
    data: {
      id: findColumn(row, 'Project Id', 'ID', 'id'),
      name: findColumn(row, 'Project', 'project', 'Name') ?? '',
      clientId: findColumn(row, 'Client Id', 'client id'),
      clientName: findColumn(row, 'Client', 'client'),
      code: findColumn(row, 'Code', 'code'),
      active: parseBoolean(findColumn(row, 'Active', 'active')),
      currency: findColumn(row, 'Currency', 'currency'),
    },
  }))
}

export function parseClients(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').Client>[] {
  return rows.map((row, index) => ({
    sourceFile,
    sourceRow: rowNumber(index),
    warnings: [],
    data: {
      id: findColumn(row, 'Client Id', 'ID', 'id'),
      name: findColumn(row, 'Client', 'client', 'Name') ?? '',
      currency: findColumn(row, 'Currency', 'currency'),
      address: findColumn(row, 'Address', 'address'),
    },
  }))
}

export function parseContacts(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').Contact>[] {
  return rows.map((row, index) => ({
    sourceFile,
    sourceRow: rowNumber(index),
    warnings: [],
    data: {
      id: findColumn(row, 'Contact Id', 'ID', 'id'),
      clientId: findColumn(row, 'Client Id', 'client id'),
      clientName: findColumn(row, 'Client', 'client'),
      firstName: findColumn(row, 'First Name', 'first name'),
      lastName: findColumn(row, 'Last Name', 'last name'),
      email: findColumn(row, 'Email', 'email'),
    },
  }))
}

export function parseTasks(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').Task>[] {
  return rows.map((row, index) => ({
    sourceFile,
    sourceRow: rowNumber(index),
    warnings: [],
    data: {
      id: findColumn(row, 'Task Id', 'ID', 'id'),
      name: findColumn(row, 'Task', 'task', 'Name') ?? '',
      projectId: findColumn(row, 'Project Id', 'project id'),
      projectName: findColumn(row, 'Project', 'project'),
    },
  }))
}

export function parsePeople(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').Person>[] {
  return rows.map((row, index) => ({
    sourceFile,
    sourceRow: rowNumber(index),
    warnings: [],
    data: {
      id: findColumn(row, 'User Id', 'Employee Id', 'ID', 'id'),
      firstName: findColumn(row, 'First Name', 'first name'),
      lastName: findColumn(row, 'Last Name', 'last name'),
      email: findColumn(row, 'Email', 'email'),
      role: findColumn(row, 'Role', 'role'),
    },
  }))
}

export function parseExpenses(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').Expense>[] {
  return rows.map((row, index) => {
    const warnings = []
    const dateResult = parseDate(findColumn(row, 'Date', 'date', 'Spent Date'))
    if (!dateResult.valid) {
      warnings.push(makeWarning('Unparseable date', sourceFile, rowNumber(index)))
    }

    return {
      sourceFile,
      sourceRow: rowNumber(index),
      warnings,
      data: {
        id: findColumn(row, 'Expense Id', 'ID', 'id'),
        date: dateResult.value ?? findColumn(row, 'Date', 'date') ?? '',
        projectId: findColumn(row, 'Project Id', 'project id'),
        projectName: findColumn(row, 'Project', 'project'),
        clientId: findColumn(row, 'Client Id', 'client id'),
        clientName: findColumn(row, 'Client', 'client'),
        amount: parseNumber(findColumn(row, 'Amount', 'amount')) ?? 0,
        currency: findColumn(row, 'Currency', 'currency'),
        notes: findColumn(row, 'Notes', 'notes'),
      },
    }
  })
}

export function parseInvoices(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').Invoice>[] {
  return rows.map((row, index) => {
    const warnings = []
    const id = findColumn(row, 'Invoice Id', 'invoice id', 'ID', 'id')
    const number = findColumn(row, 'Invoice Number', 'invoice number', 'Number', 'number')

    if (!id && !number) {
      warnings.push(makeWarning('Missing invoice identifier', sourceFile, rowNumber(index)))
    }

    return {
      sourceFile,
      sourceRow: rowNumber(index),
      warnings,
      data: {
        id,
        number,
        clientId: findColumn(row, 'Client Id', 'client id'),
        clientName: findColumn(row, 'Client', 'client'),
        issueDate: findColumn(row, 'Issue Date', 'issue date', 'Date'),
        dueDate: findColumn(row, 'Due Date', 'due date'),
        amount: parseNumber(findColumn(row, 'Amount', 'amount', 'Total')) ?? 0,
        currency: findColumn(row, 'Currency', 'currency'),
        status: findColumn(row, 'Status', 'status'),
      },
    }
  })
}

export function parseInvoiceLineItems(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').InvoiceLineItem>[] {
  return rows.map((row, index) => ({
    sourceFile,
    sourceRow: rowNumber(index),
    warnings: [],
    data: {
      id: findColumn(row, 'Line Item Id', 'ID', 'id'),
      invoiceId: findColumn(row, 'Invoice Id', 'invoice id'),
      invoiceNumber: findColumn(row, 'Invoice Number', 'invoice number'),
      description: findColumn(row, 'Description', 'description'),
      quantity: parseNumber(findColumn(row, 'Quantity', 'quantity')),
      unitPrice: parseNumber(findColumn(row, 'Unit Price', 'unit price')),
      amount: parseNumber(findColumn(row, 'Amount', 'amount')) ?? 0,
      currency: findColumn(row, 'Currency', 'currency'),
    },
  }))
}

export function parsePayments(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').Payment>[] {
  return rows.map((row, index) => ({
    sourceFile,
    sourceRow: rowNumber(index),
    warnings: [],
    data: {
      id: findColumn(row, 'Payment Id', 'ID', 'id'),
      invoiceId: findColumn(row, 'Invoice Id', 'invoice id'),
      invoiceNumber: findColumn(row, 'Invoice Number', 'invoice number'),
      amount: parseNumber(findColumn(row, 'Amount', 'amount')) ?? 0,
      currency: findColumn(row, 'Currency', 'currency'),
      paidDate: findColumn(row, 'Paid Date', 'paid date', 'Payment Date', 'payment date'),
      notes: findColumn(row, 'Notes', 'notes'),
    },
  }))
}

export function parseEstimates(
  rows: Record<string, string>[],
  sourceFile: string,
): ParsedRecord<import('../types/models').Estimate>[] {
  return rows.map((row, index) => ({
    sourceFile,
    sourceRow: rowNumber(index),
    warnings: [],
    data: {
      id: findColumn(row, 'Estimate Id', 'estimate id', 'ID', 'id'),
      number: findColumn(row, 'Estimate Number', 'estimate number', 'Number', 'number'),
      clientId: findColumn(row, 'Client Id', 'client id'),
      clientName: findColumn(row, 'Client', 'client'),
      issueDate: findColumn(row, 'Issue Date', 'issue date'),
      amount: parseNumber(findColumn(row, 'Amount', 'amount', 'Total')) ?? 0,
      currency: findColumn(row, 'Currency', 'currency'),
      status: findColumn(row, 'Status', 'status'),
    },
  }))
}

export function parseRowsFromFile(
  content: ArrayBuffer,
  textContent: string | undefined,
  filename: string,
): Record<string, string>[] {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
    const text = textContent ?? new TextDecoder('utf-8').decode(content)
    return parseCsvRows(text)
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return parseXlsxRows(content)
  }
  return []
}

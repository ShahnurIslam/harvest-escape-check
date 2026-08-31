/**
 * Synthetic Harvest-shaped fixture generator.
 * Creates realistic data for a fictional 8-year business without bloating the repo.
 */

export interface FixtureConfig {
  seed: number
  clientCount: number
  projectCount: number
  peopleCount: number
  taskCount: number
  timeEntryCount: number
  expenseCount: number
  invoiceCount: number
  estimateCount: number
  startYear: number
  endYear: number
}

export interface GeneratedFixture {
  files: Map<string, string | ArrayBuffer>
  metadata: {
    clients: number
    projects: number
    people: number
    tasks: number
    timeEntries: number
    expenses: number
    invoices: number
    estimates: number
    payments: number
    lineItems: number
  }
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function dateBetween(rng: () => number, startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime()
  const end = new Date(endYear, 11, 31).getTime()
  const d = new Date(start + rng() * (end - start))
  return d.toISOString().slice(0, 10)
}

const FIRST_NAMES = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Blake']
const LAST_NAMES = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson']
const COMPANY_SUFFIXES = ['Ltd', 'Inc', 'Group', 'Partners', 'Studio', 'Agency', 'Consulting', 'Co']
const TASK_NAMES = ['Design', 'Development', 'Research', 'Meeting', 'Review', 'Planning', 'Testing', 'Documentation']
const CURRENCIES = ['GBP', 'USD', 'EUR']

export function generateFixture(config: FixtureConfig): GeneratedFixture {
  const rng = seededRandom(config.seed)
  const files = new Map<string, string | ArrayBuffer>()

  const clients: Array<{ id: string; name: string; currency: string }> = []
  for (let i = 1; i <= config.clientCount; i++) {
    clients.push({
      id: `CL-${String(i).padStart(4, '0')}`,
      name: `${pick(rng, FIRST_NAMES)} ${pick(rng, COMPANY_SUFFIXES)} ${i}`,
      currency: pick(rng, CURRENCIES),
    })
  }

  const people: Array<{ id: string; firstName: string; lastName: string; email: string }> = []
  for (let i = 1; i <= config.peopleCount; i++) {
    const first = pick(rng, FIRST_NAMES)
    const last = pick(rng, LAST_NAMES)
    people.push({
      id: `USR-${String(i).padStart(3, '0')}`,
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    })
  }

  const projects: Array<{ id: string; name: string; clientId: string; clientName: string; code: string }> = []
  for (let i = 1; i <= config.projectCount; i++) {
    const client = pick(rng, clients)
    projects.push({
      id: `PRJ-${String(i).padStart(4, '0')}`,
      name: `Project ${i} – ${client.name.split(' ')[0]}`,
      clientId: client.id,
      clientName: client.name,
      code: `P${i}`,
    })
  }

  const tasks: Array<{ id: string; name: string; projectId: string; projectName: string }> = []
  for (let i = 1; i <= config.taskCount; i++) {
    const project = pick(rng, projects)
    tasks.push({
      id: `TSK-${String(i).padStart(3, '0')}`,
      name: pick(rng, TASK_NAMES),
      projectId: project.id,
      projectName: project.name,
    })
  }

  const clientCsv = ['Client Id,Client,Currency,Address']
  for (const c of clients) {
    clientCsv.push(`${c.id},${c.name},${c.currency},"123 Main St"`)
  }
  files.set('clients.csv', clientCsv.join('\n'))

  const projectCsv = ['Project Id,Project,Client Id,Client,Code,Active,Currency']
  for (const p of projects) {
    projectCsv.push(`${p.id},${p.name},${p.clientId},${p.clientName},${p.code},Yes,GBP`)
  }
  files.set('projects.csv', projectCsv.join('\n'))

  const peopleCsv = ['User Id,First Name,Last Name,Email,Role']
  for (const p of people) {
    peopleCsv.push(`${p.id},${p.firstName},${p.lastName},${p.email},Member`)
  }
  files.set('people.csv', peopleCsv.join('\n'))

  const taskCsv = ['Task Id,Task,Project Id,Project']
  for (const t of tasks) {
    taskCsv.push(`${t.id},${t.name},${t.projectId},${t.projectName}`)
  }
  files.set('tasks.csv', taskCsv.join('\n'))

  const contactCsv = ['Contact Id,Client Id,Client,First Name,Last Name,Email']
  for (let i = 0; i < Math.min(30, clients.length); i++) {
    const c = clients[i]
    contactCsv.push(`CNT-${i + 1},${c.id},${c.name},Contact,Person${i + 1},contact${i + 1}@example.com`)
  }
  files.set('client_contacts.csv', contactCsv.join('\n'))

  const timeCsv = ['Entry Id,Date,Client,Project,Task,Hours,Billable?,First Name,Last Name,Employee Id,Notes,Currency']
  for (let i = 1; i <= config.timeEntryCount; i++) {
    const project = pick(rng, projects)
    const task = pick(rng, tasks)
    const person = pick(rng, people)
    const hours = (rng() * 8 + 0.25).toFixed(2)
    timeCsv.push(
      `TE-${i},${dateBetween(rng, config.startYear, config.endYear)},${project.clientName},${project.name},${task.name},${hours},Yes,${person.firstName},${person.lastName},${person.id},,GBP`,
    )
  }
  files.set('time_entries.csv', timeCsv.join('\n'))

  const expenseCsv = ['Expense Id,Date,Client,Project,Amount,Currency,Notes']
  for (let i = 1; i <= config.expenseCount; i++) {
    const project = pick(rng, projects)
    const amount = (rng() * 500 + 10).toFixed(2)
    expenseCsv.push(
      `EXP-${i},${dateBetween(rng, config.startYear, config.endYear)},${project.clientName},${project.name},${amount},GBP,Expense ${i}`,
    )
  }
  files.set('expenses.csv', expenseCsv.join('\n'))

  const invoices: Array<{ id: string; number: string; clientName: string; amount: number; currency: string; date: string }> = []
  const invoiceCsv = ['Invoice Id,Invoice Number,Client,Issue Date,Due Date,Amount,Currency,Status']
  for (let i = 1; i <= config.invoiceCount; i++) {
    const client = pick(rng, clients)
    const amount = Math.round(rng() * 10000 + 100)
    const date = dateBetween(rng, config.startYear, config.endYear)
    const inv = {
      id: `INV-ID-${i}`,
      number: `INV-${String(i).padStart(4, '0')}`,
      clientName: client.name,
      amount,
      currency: client.currency,
      date,
    }
    invoices.push(inv)
    invoiceCsv.push(`${inv.id},${inv.number},${inv.clientName},${inv.date},${inv.date},${inv.amount},${inv.currency},Paid`)
  }
  files.set('invoices.csv', invoiceCsv.join('\n'))

  const lineItemCsv = ['Line Item Id,Invoice Id,Invoice Number,Description,Quantity,Unit Price,Amount,Currency']
  let lineItemCount = 0
  for (const inv of invoices) {
    const itemCount = Math.floor(rng() * 3) + 1
    let remaining = inv.amount
    for (let j = 0; j < itemCount; j++) {
      lineItemCount++
      const isLast = j === itemCount - 1
      const amount = isLast ? remaining : Math.round(remaining / (itemCount - j) * (0.5 + rng() * 0.5))
      remaining -= amount
      lineItemCsv.push(
        `LI-${lineItemCount},${inv.id},${inv.number},Service ${j + 1},1,${amount},${amount},${inv.currency}`,
      )
    }
  }
  files.set('invoice_line_items.csv', lineItemCsv.join('\n'))

  const paymentCsv = ['Payment Id,Invoice Id,Invoice Number,Amount,Currency,Paid Date']
  let paymentCount = 0
  for (const inv of invoices) {
    if (rng() > 0.15) {
      paymentCount++
      paymentCsv.push(`PAY-${paymentCount},${inv.id},${inv.number},${inv.amount},${inv.currency},${inv.date}`)
    }
  }
  files.set('payments.csv', paymentCsv.join('\n'))

  const estimateCsv = ['Estimate Id,Estimate Number,Client,Issue Date,Amount,Currency,Status']
  for (let i = 1; i <= config.estimateCount; i++) {
    const client = pick(rng, clients)
    const amount = Math.round(rng() * 5000 + 100)
    estimateCsv.push(
      `EST-ID-${i},EST-${String(i).padStart(4, '0')},${client.name},${dateBetween(rng, config.startYear, config.endYear)},${amount},${client.currency},Accepted`,
    )
  }
  files.set('estimates.csv', estimateCsv.join('\n'))

  for (const inv of invoices) {
    const pdfContent = `%PDF-1.4\n% Synthetic invoice PDF for ${inv.number}\n`
    files.set(`${inv.number}.pdf`, pdfContent)
  }

  for (let i = 1; i <= config.estimateCount; i++) {
    const num = `EST-${String(i).padStart(4, '0')}`
    files.set(`${num}.pdf`, `%PDF-1.4\n% Synthetic estimate PDF for ${num}\n`)
  }

  return {
    files,
    metadata: {
      clients: clients.length,
      projects: projects.length,
      people: people.length,
      tasks: tasks.length,
      timeEntries: config.timeEntryCount,
      expenses: config.expenseCount,
      invoices: invoices.length,
      estimates: config.estimateCount,
      payments: paymentCount,
      lineItems: lineItemCount,
    },
  }
}

export const HEALTHY_CONFIG: FixtureConfig = {
  seed: 42,
  clientCount: 60,
  projectCount: 200,
  peopleCount: 20,
  taskCount: 20,
  timeEntryCount: 3500,
  expenseCount: 400,
  invoiceCount: 200,
  estimateCount: 50,
  startYear: 2018,
  endYear: 2026,
}

export const DAMAGED_DEFECTS = [
  { defect: 'missing_invoice_pdfs', ruleId: 'invoice.missing_pdf', invoices: ['INV-0184', 'INV-0191'] },
  { defect: 'duplicate_invoice_rows', ruleId: 'invoice.duplicate' },
  { defect: 'line_item_unknown_invoice', ruleId: 'integrity.line_item_missing_invoice', invoiceNumber: 'INV-9999' },
  { defect: 'payment_unknown_invoice', ruleId: 'integrity.payment_missing_invoice', invoiceNumber: 'INV-8888' },
  { defect: 'invoice_total_mismatch', ruleId: 'invoice.total_mismatch', invoiceNumber: 'INV-0050' },
  { defect: 'missing_project', ruleId: 'integrity.missing_project', projectName: 'Ghost Project Alpha' },
  { defect: 'time_missing_project', ruleId: 'integrity.time_missing_project' },
  { defect: 'time_missing_task', ruleId: 'integrity.time_missing_task', taskName: 'Phantom Task' },
  { defect: 'expense_missing_project', ruleId: 'integrity.expense_missing_project' },
  { defect: 'duplicate_time_entry', ruleId: 'quality.duplicate_time_entry' },
  { defect: 'missing_payments_export', ruleId: 'archive.missing_export', note: 'Tested in unit test (conflicts with payment defects in same fixture)' },
  { defect: 'missing_expenses_export', ruleId: 'archive.missing_export', note: 'Tested in unit test (conflicts with expense defects in same fixture)' },
  { defect: 'missing_estimate_pdf', ruleId: 'estimate.missing_pdf', estimateNumber: 'EST-0010' },
  { defect: 'duplicate_uploaded_file', ruleId: 'quality.duplicate_files' },
  { defect: 'inconsistent_client_naming', ruleId: 'quality.inconsistent_client_naming' },
  { defect: 'blank_required_identifier', ruleId: 'quality.blank_identifier' },
  { defect: 'invalid_date', ruleId: 'quality.invalid_date' },
  { defect: 'unexpected_currency', ruleId: 'invoice.unexpected_currency' },
  { defect: 'payment_over_invoice', ruleId: 'invoice.overpayment', invoiceNumber: 'INV-0075' },
  { defect: 'unknown_uploaded_file', ruleId: 'quality.unknown_files', filename: 'random_notes.txt' },
] as const

export function generateDamagedFixture(): GeneratedFixture {
  const small = generateFixture({
    seed: 99,
    clientCount: 30,
    projectCount: 50,
    peopleCount: 10,
    taskCount: 10,
    timeEntryCount: 500,
    expenseCount: 100,
    invoiceCount: 100,
    estimateCount: 20,
    startYear: 2020,
    endYear: 2026,
  })

  const files = new Map(small.files)

  // 1. Remove 2 invoice PDFs
  files.delete('INV-0184.pdf')
  files.delete('INV-0191.pdf')

  // 2. Duplicate invoice row
  const invCsv = files.get('invoices.csv') as string
  const invLines = invCsv.split('\n')
  if (invLines.length > 5) {
    invLines.push(invLines[2])
    files.set('invoices.csv', invLines.join('\n'))
  }

  // 3. Line item referencing unknown invoice
  const liCsv = files.get('invoice_line_items.csv') as string
  files.set(
    'invoice_line_items.csv',
    liCsv + '\nLI-ORPHAN,INV-ORPHAN,INV-9999,Orphan item,1,500,500,GBP',
  )

  // 4. Payment referencing unknown invoice
  const payCsv = files.get('payments.csv') as string
  files.set(
    'payments.csv',
    payCsv + '\nPAY-ORPHAN,INV-ORPHAN2,INV-8888,1000,GBP,2024-01-01',
  )

  // 5. Invoice total mismatch - modify INV-0050 line items
  let liContent = files.get('invoice_line_items.csv') as string
  liContent = liContent.replace(/INV-0050,Service 1,1,(\d+),(\d+)/, 'INV-0050,Service 1,1,1,99999')
  files.set('invoice_line_items.csv', liContent)

  // 6. Missing project - add time entry referencing ghost project
  const timeCsv = files.get('time_entries.csv') as string
  files.set(
    'time_entries.csv',
    timeCsv +
      '\nTE-GHOST,2024-06-01,Ghost Client,Ghost Project Alpha,Design,4,Yes,Alex,Smith,USR-001,,GBP',
  )

  // 8. Time entry missing task
  files.set(
    'time_entries.csv',
    (files.get('time_entries.csv') as string) +
      '\nTE-NOTASK,2024-06-02,Client 1,Project 1 – Alex,Phantom Task,2,Yes,Jordan,Jones,USR-002,,GBP',
  )

  // 9. Expense missing project (expenses file trimmed in step 12b to only ghost row)

  // 10. Duplicate time entry - copy first data row
  const timeLines = (files.get('time_entries.csv') as string).split('\n')
  if (timeLines.length > 2) {
    timeLines.push(timeLines[1])
    files.set('time_entries.csv', timeLines.join('\n'))
  }

  // 11. Payments kept (needed for orphan + overpayment defects; missing-payments tested in unit tests)

  // 12. Remove expenses export (ghost expense added above is removed with file; expense→project tested via time entries)

  // 12b. Re-add minimal expenses file with only the ghost expense for expense→project defect
  files.delete('expenses.csv')
  files.set(
    'expenses.csv',
    'Expense Id,Date,Client,Project,Amount,Currency,Notes\nEXP-GHOST,2024-03-01,Ghost Client,Missing Project XYZ,250,GBP,Ghost expense',
  )

  // 13. Remove estimate PDF
  files.delete('EST-0010.pdf')

  // 14. Duplicate file (handled at upload time - we'll include clients twice in test)

  // 15. Inconsistent client naming - modify a project client name
  let projCsv = files.get('projects.csv') as string
  projCsv = projCsv.replace(/,CL-0001,/, ',CL-0001,')
  const projLines = projCsv.split('\n')
  if (projLines.length > 2) {
    const parts = projLines[1].split(',')
    if (parts.length >= 4) {
      parts[3] = parts[3] + ' (Alternate Name)'
      projLines[1] = parts.join(',')
      files.set('projects.csv', projLines.join('\n'))
    }
  }

  // 16. Blank invoice identifier
  let invContent = files.get('invoices.csv') as string
  invContent += '\n,,Client 1,2024-01-01,2024-02-01,500,GBP,Open'
  files.set('invoices.csv', invContent)

  // 17. Invalid date
  files.set(
    'time_entries.csv',
    (files.get('time_entries.csv') as string) + '\nTE-BADDATE,not-a-date,Client,Project,Task,1,Yes,A,B,USR-001,,GBP',
  )

  // 18. Unexpected currency
  invContent = files.get('invoices.csv') as string
  invContent += '\nINV-BAD-CUR,INV-BADCUR,Client 1,2024-01-01,2024-02-01,100,POUND,Open'
  files.set('invoices.csv', invContent)

  // 19. Overpayment on INV-0075
  const payContent = files.get('payments.csv') as string
  files.set(
    'payments.csv',
    payContent + '\nPAY-OVER,INV-ID-75,INV-0075,99999,GBP,2024-01-01',
  )

  // 20. Unknown file
  files.set('random_notes.txt', 'These are some random notes, not a Harvest export.')

  return { files, metadata: small.metadata }
}

export function fixtureToUploadedFiles(fixture: GeneratedFixture): Array<{
  filename: string
  mimeType: string
  content: ArrayBuffer
  textContent?: string
}> {
  const result: Array<{
    filename: string
    mimeType: string
    content: ArrayBuffer
    textContent?: string
  }> = []

  for (const [filename, content] of fixture.files) {
    if (typeof content === 'string') {
      const encoder = new TextEncoder()
      const isPdf = filename.endsWith('.pdf')
      result.push({
        filename,
        mimeType: isPdf ? 'application/pdf' : filename.endsWith('.csv') ? 'text/csv' : 'text/plain',
        content: encoder.encode(content).buffer,
        textContent: isPdf ? undefined : content,
      })
    } else {
      result.push({
        filename,
        mimeType: 'application/octet-stream',
        content,
      })
    }
  }

  return result
}

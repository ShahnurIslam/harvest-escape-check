import type { AuditFinding } from '../../types/audit'

export function ruleDuplicateTimeEntries(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const seen = new Map<string, number>()
  const dupes: AuditFinding['affectedRecords'] = []

  for (const entry of context.archive.timeEntries) {
    const key = [
      entry.data.date,
      entry.data.projectName ?? entry.data.projectId,
      entry.data.personName ?? entry.data.personId,
      entry.data.hours,
      entry.data.notes ?? '',
    ].join('|')

    if (seen.has(key)) {
      dupes.push({
        label: `${entry.data.date} – ${entry.data.projectName} (${entry.data.hours}h)`,
        id: entry.data.id,
        sourceFile: entry.sourceFile,
        sourceRow: entry.sourceRow,
      })
    } else {
      seen.set(key, 1)
    }
  }

  if (dupes.length === 0) return []

  return [
    {
      ruleId: 'quality.duplicate_time_entry',
      severity: 'warning',
      title: `${dupes.length} duplicate time entr${dupes.length === 1 ? 'y' : 'ies'}`,
      explanation: 'These time entries appear to be exact duplicates.',
      affectedRecords: dupes.slice(0, 50),
      sourceFiles: [...new Set(dupes.map((d) => d.sourceFile))],
      suggestedAction: 'Check for overlapping exports or duplicate uploads.',
      category: 'quality',
    },
  ]
}

export function ruleUnparseableDates(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const warnings = context.archive.parsingWarnings.filter((w) => w.message.includes('date'))

  if (warnings.length === 0) return []

  return [
    {
      ruleId: 'quality.invalid_date',
      severity: 'warning',
      title: `${warnings.length} unparseable date(s)`,
      explanation: 'Some rows contain dates that could not be parsed.',
      affectedRecords: warnings.slice(0, 50).map((w) => ({
        label: `Row ${w.sourceRow ?? '?'}`,
        sourceFile: w.sourceFile,
        sourceRow: w.sourceRow,
      })),
      sourceFiles: [...new Set(warnings.map((w) => w.sourceFile))],
      suggestedAction: 'Review source rows and verify date formats.',
      category: 'quality',
    },
  ]
}

export function ruleBlankIdentifiers(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const blankInvoices = context.archive.invoices.filter((i) => !i.data.id && !i.data.number)

  if (blankInvoices.length === 0) return []

  return [
    {
      ruleId: 'quality.blank_identifier',
      severity: 'critical',
      title: `${blankInvoices.length} record(s) with blank required identifier`,
      explanation: 'Records are missing identifiers needed for reconciliation.',
      affectedRecords: blankInvoices.slice(0, 50).map((i) => ({
        label: `Invoice row ${i.sourceRow}`,
        sourceFile: i.sourceFile,
        sourceRow: i.sourceRow,
      })),
      sourceFiles: [...new Set(blankInvoices.map((i) => i.sourceFile))],
      suggestedAction: 'Re-export affected data from Harvest.',
      category: 'quality',
    },
  ]
}

export function ruleInconsistentClientNaming(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const clientNames = new Map<string, Set<string>>()

  for (const client of context.archive.clients) {
    if (!client.data.id) continue
    const variants = clientNames.get(client.data.id) ?? new Set()
    variants.add(client.data.name.toLowerCase())
    clientNames.set(client.data.id, variants)
  }

  const inconsistent: AuditFinding['affectedRecords'] = []
  for (const [id, names] of clientNames) {
    if (names.size > 1) {
      inconsistent.push({ label: `${id}: ${[...names].join(' / ')}`, sourceFile: '' })
    }
  }

  const projectClientNames = new Set(
    context.archive.projects.map((p) => p.data.clientName?.toLowerCase()).filter(Boolean) as string[],
  )
  const clientExportNames = new Set(
    context.archive.clients.map((c) => c.data.name.toLowerCase()),
  )

  const orphanNames = [...projectClientNames].filter((n) => !clientExportNames.has(n))
  for (const name of orphanNames) {
    inconsistent.push({ label: `Project references "${name}" not in clients export`, sourceFile: '' })
  }

  if (inconsistent.length === 0) return []

  return [
    {
      ruleId: 'quality.inconsistent_client_naming',
      severity: 'warning',
      title: `${inconsistent.length} client naming inconsistency(ies)`,
      explanation: 'Client names differ across exports or projects reference clients not in the clients export.',
      affectedRecords: inconsistent.slice(0, 50),
      sourceFiles: [],
      suggestedAction: 'Verify client names are consistent across all exports.',
      category: 'quality',
    },
  ]
}

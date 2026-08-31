import type { AuditFinding } from '../../types/audit'

export function ruleDuplicateEstimates(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const seen = new Set<string>()
  const dupes: AuditFinding['affectedRecords'] = []

  for (const est of context.archive.estimates) {
    const key = est.data.id ?? `num:${(est.data.number ?? '').toLowerCase()}`
    if (!est.data.id && !est.data.number) continue
    if (seen.has(key)) {
      dupes.push({
        label: est.data.number ?? est.data.id ?? 'unknown',
        sourceFile: est.sourceFile,
        sourceRow: est.sourceRow,
      })
    } else {
      seen.add(key)
    }
  }

  if (dupes.length === 0) return []

  return [
    {
      ruleId: 'estimate.duplicate',
      severity: 'warning',
      title: `${dupes.length} duplicate estimate row(s)`,
      explanation: 'Multiple rows share the same estimate identifier.',
      affectedRecords: dupes.slice(0, 50),
      sourceFiles: [...new Set(dupes.map((d) => d.sourceFile))],
      suggestedAction: 'Check for duplicate exports.',
      category: 'estimate',
    },
  ]
}

export function ruleMissingEstimatePdfs(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const pdfNumbers = new Set(
    context.archive.estimatePdfs.map((p) => p.linkedNumber?.toLowerCase()).filter(Boolean) as string[],
  )

  const missing: AuditFinding['affectedRecords'] = []
  for (const est of context.archive.estimates) {
    const num = est.data.number
    if (!num) continue
    if (!pdfNumbers.has(num.toLowerCase())) {
      missing.push({ label: num, id: est.data.id, sourceFile: est.sourceFile })
    }
  }

  if (missing.length === 0) return []

  return [
    {
      ruleId: 'estimate.missing_pdf',
      severity: 'warning',
      title: `${missing.length} estimate PDF(s) appear to be missing`,
      explanation: 'Estimates in the export do not have a matching PDF file.',
      affectedRecords: missing.slice(0, 50),
      sourceFiles: [],
      suggestedAction: 'Download estimate PDFs from Harvest.',
      category: 'estimate',
    },
  ]
}

export function ruleMalformedEstimateIds(context: import('../../types/audit').AuditContext): AuditFinding[] {
  const malformed = context.archive.estimates.filter((e) => !e.data.id && !e.data.number)

  if (malformed.length === 0) return []

  return [
    {
      ruleId: 'estimate.malformed_id',
      severity: 'warning',
      title: `${malformed.length} estimate(s) with missing identifier`,
      explanation: 'Estimate rows lack an ID or number.',
      affectedRecords: malformed.slice(0, 50).map((e) => ({
        label: `Row ${e.sourceRow}`,
        sourceFile: e.sourceFile,
        sourceRow: e.sourceRow,
      })),
      sourceFiles: [...new Set(malformed.map((e) => e.sourceFile))],
      suggestedAction: 'Re-export estimates from Harvest.',
      category: 'estimate',
    },
  ]
}

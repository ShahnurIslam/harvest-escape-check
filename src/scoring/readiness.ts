import type { AuditFinding, ReadinessScore, ScorePenalty } from '../types/audit'

const SEVERITY_PENALTIES: Record<string, number> = {
  critical: 15,
  warning: 5,
  info: 0,
}

const RULE_PENALTIES: Record<string, number> = {
  'archive.missing_export': 10,
  'integrity.time_missing_project': 12,
  'integrity.payment_missing_invoice': 10,
  'integrity.line_item_missing_invoice': 10,
  'invoice.missing_pdf': 3,
  'estimate.missing_pdf': 2,
  'quality.unknown_files': 3,
}

export function calculateReadinessScore(findings: AuditFinding[]): ReadinessScore {
  const penalties: ScorePenalty[] = []
  let score = 100

  const actionableFindings = findings.filter((f) => f.category !== 'blind_spot')

  for (const finding of actionableFindings) {
    const basePenalty = SEVERITY_PENALTIES[finding.severity] ?? 0
    const ruleBonus = RULE_PENALTIES[finding.ruleId] ?? 0
    const points = Math.max(basePenalty, ruleBonus)

    if (points > 0) {
      penalties.push({
        reason: finding.title,
        points,
        ruleId: finding.ruleId,
      })
      score -= points
    }
  }

  score = Math.max(0, Math.min(100, score))

  let state: ReadinessScore['state']
  let stateLabel: string

  if (score >= 90) {
    state = 'ready'
    stateLabel = 'Archive looks ready'
  } else if (score >= 70) {
    state = 'review'
    stateLabel = 'Review before cancelling'
  } else {
    state = 'not_ready'
    stateLabel = 'Do not cancel yet'
  }

  return { score, state, stateLabel, penalties }
}

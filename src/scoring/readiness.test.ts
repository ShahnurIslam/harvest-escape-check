import { describe, it, expect } from 'vitest'
import { calculateReadinessScore } from '../scoring/readiness'
import type { AuditFinding } from '../types/audit'

describe('readiness scoring', () => {
  it('returns 100 for no findings', () => {
    const score = calculateReadinessScore([])
    expect(score.score).toBe(100)
    expect(score.state).toBe('ready')
  })

  it('penalises critical findings heavily', () => {
    const findings: AuditFinding[] = [
      {
        ruleId: 'integrity.time_missing_project',
        severity: 'critical',
        title: 'Missing projects',
        explanation: 'test',
        affectedRecords: [],
        sourceFiles: [],
        suggestedAction: 'test',
        category: 'integrity',
      },
    ]
    const score = calculateReadinessScore(findings)
    expect(score.score).toBeLessThan(90)
    expect(score.penalties.length).toBeGreaterThan(0)
  })

  it('classifies score states correctly', () => {
    expect(calculateReadinessScore([]).state).toBe('ready')
    expect(calculateReadinessScore([]).stateLabel).toBe('Archive looks ready')
  })

  it('caps score at 0', () => {
    const findings: AuditFinding[] = Array.from({ length: 20 }, (_, i) => ({
      ruleId: `test.${i}`,
      severity: 'critical' as const,
      title: `Issue ${i}`,
      explanation: 'test',
      affectedRecords: [],
      sourceFiles: [],
      suggestedAction: 'test',
      category: 'integrity' as const,
    }))
    const score = calculateReadinessScore(findings)
    expect(score.score).toBe(0)
    expect(score.state).toBe('not_ready')
  })
})

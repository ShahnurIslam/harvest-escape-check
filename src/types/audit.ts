import type { ExportCategory } from './export-types'
import type { SourceRef } from './models'

export type Severity = 'info' | 'warning' | 'critical'

export interface AffectedRecord extends SourceRef {
  label: string
  id?: string
}

export interface AuditFinding {
  ruleId: string
  severity: Severity
  title: string
  explanation: string
  affectedRecords: AffectedRecord[]
  sourceFiles: string[]
  suggestedAction: string
  category: 'completeness' | 'integrity' | 'invoice' | 'estimate' | 'quality' | 'blind_spot'
}

export interface ArchiveSummary {
  timeEntries: number
  projects: number
  clients: number
  contacts: number
  tasks: number
  people: number
  expenses: number
  invoices: number
  invoiceLineItems: number
  payments: number
  invoicePdfs: number
  estimates: number
  estimatePdfs: number
  unknownFiles: number
}

export interface ReadinessScore {
  score: number
  state: 'ready' | 'review' | 'not_ready'
  stateLabel: string
  penalties: ScorePenalty[]
}

export interface ScorePenalty {
  reason: string
  points: number
  ruleId?: string
}

export interface AuditResult {
  findings: AuditFinding[]
  blindSpots: AuditFinding[]
  summary: ArchiveSummary
  readiness: ReadinessScore
  presentCategories: ExportCategory[]
  missingCategories: ExportCategory[]
}

export interface AuditRule {
  id: string
  name: string
  category: AuditFinding['category']
  run: (context: AuditContext) => AuditFinding[]
}

export interface AuditContext {
  archive: import('./models').NormalisedArchive
  presentCategories: ExportCategory[]
  missingCategories: ExportCategory[]
}

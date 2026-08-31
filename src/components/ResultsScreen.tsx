import { useState } from 'react'
import type { AuditResult } from '../types/audit'
import type { AuditFinding } from '../types/audit'
import type { SchemaFingerprintReport } from '../types/diagnostic'
import { serialiseSchemaFingerprint } from '../diagnostic/schema-fingerprint'
import { AffiliationNotice } from './AffiliationNotice'

interface ResultsScreenProps {
  result: AuditResult
  schemaFingerprint?: SchemaFingerprintReport
  onStartOver: () => void
}

function FindingCard({ finding }: { finding: AuditFinding }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`finding finding-${finding.severity}`}>
      <div className="finding-header" onClick={() => setExpanded(!expanded)}>
        <span className={`severity-badge severity-${finding.severity}`}>{finding.severity}</span>
        <h4>{finding.title}</h4>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>
      <p className="finding-explanation">{finding.explanation}</p>
      <p className="finding-action">
        <strong>Suggested action:</strong> {finding.suggestedAction}
      </p>
      {finding.affectedRecords.length > 0 && (
        <div className="affected-records">
          {finding.affectedRecords.slice(0, expanded ? undefined : 5).map((r, i) => (
            <span key={i} className="record-tag">
              {r.label}
            </span>
          ))}
          {!expanded && finding.affectedRecords.length > 5 && (
            <span className="record-tag more" onClick={() => setExpanded(true)}>
              +{finding.affectedRecords.length - 5} more
            </span>
          )}
        </div>
      )}
      {expanded && finding.sourceFiles.length > 0 && (
        <div className="technical-detail">
          <strong>Source files:</strong> {finding.sourceFiles.join(', ')}
        </div>
      )}
    </div>
  )
}

function StatRow({
  label,
  count,
  total,
  status,
}: {
  label: string
  count: number | string
  total?: number
  status: 'ok' | 'warn' | 'missing'
}) {
  const icon = status === 'ok' ? '✓' : status === 'warn' ? '⚠' : '✗'
  const display = total !== undefined ? `${count} / ${total}` : count

  return (
    <div className={`stat-row stat-${status}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {display} {icon}
      </span>
    </div>
  )
}

export function ResultsScreen({ result, schemaFingerprint, onStartOver }: ResultsScreenProps) {
  const { summary, readiness, findings, blindSpots } = result
  const [diagnosticCopied, setDiagnosticCopied] = useState(false)
  const critical = findings.filter((f) => f.severity === 'critical')
  const warnings = findings.filter((f) => f.severity === 'warning')
  const infos = findings.filter((f) => f.severity === 'info')

  const invoicePdfStatus =
    summary.invoicePdfs < summary.invoices
      ? 'warn'
      : summary.invoices > 0
        ? 'ok'
        : 'missing'

  const diagnosticJson = schemaFingerprint ? serialiseSchemaFingerprint(schemaFingerprint) : ''

  const handleCopyDiagnostic = async () => {
    if (!diagnosticJson) return
    await navigator.clipboard.writeText(diagnosticJson)
    setDiagnosticCopied(true)
    setTimeout(() => setDiagnosticCopied(false), 2000)
  }

  const handleDownloadDiagnostic = () => {
    if (!diagnosticJson) return
    const blob = new Blob([diagnosticJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'harvest-schema-fingerprint.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="screen results">
      <header className="hero">
        <h1>
          Harvest archive: <span className={`score score-${readiness.state}`}>{readiness.score}%</span>{' '}
          ready
        </h1>
        <AffiliationNotice />
        <p className={`state-label state-${readiness.state}`}>{readiness.stateLabel}</p>
      </header>

      <section className="card stats-card">
        <StatRow label="Time entries" count={summary.timeEntries.toLocaleString()} status={summary.timeEntries > 0 ? 'ok' : 'missing'} />
        <StatRow label="Projects" count={summary.projects} status={summary.projects > 0 ? 'ok' : 'missing'} />
        <StatRow label="Clients" count={summary.clients} status={summary.clients > 0 ? 'ok' : 'missing'} />
        <StatRow label="Invoices" count={summary.invoices} status={summary.invoices > 0 ? 'ok' : 'missing'} />
        <StatRow
          label="Invoice PDFs"
          count={summary.invoicePdfs}
          total={summary.invoices}
          status={invoicePdfStatus}
        />
        <StatRow label="Payments" count={summary.payments} status={summary.payments > 0 ? 'ok' : 'warn'} />
        <StatRow label="Expenses" count={summary.expenses} status={summary.expenses > 0 ? 'ok' : 'warn'} />
        <StatRow label="Estimates" count={summary.estimates} status={summary.estimates > 0 ? 'ok' : 'missing'} />
      </section>

      <section className="summary-counts">
        <span className="count-critical">Critical issues: {critical.length}</span>
        <span className="count-warning">Warnings: {warnings.length}</span>
        {infos.length > 0 && <span className="count-info">Info: {infos.length}</span>}
      </section>

      {readiness.penalties.length > 0 && (
        <section className="card">
          <h3>Score breakdown</h3>
          <ul className="penalty-list">
            {readiness.penalties.map((p, i) => (
              <li key={i}>
                −{p.points} pts: {p.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {critical.length > 0 && (
        <section className="findings-section">
          <h2>Critical issues</h2>
          {critical.map((f, i) => (
            <FindingCard key={`${f.ruleId}-${i}`} finding={f} />
          ))}
        </section>
      )}

      {warnings.length > 0 && (
        <section className="findings-section">
          <h2>Warnings</h2>
          {warnings.map((f, i) => (
            <FindingCard key={`${f.ruleId}-${i}`} finding={f} />
          ))}
        </section>
      )}

      <section className="findings-section blind-spots">
        <h2>Known Harvest export limitations</h2>
        <p className="note">
          These items cannot be verified automatically from standard exports. They are not counted
          against your readiness score.
        </p>
        {blindSpots.map((f) => (
          <FindingCard key={f.ruleId} finding={f} />
        ))}
      </section>

      <p className="disclaimer">
        This is a technical completeness check based on the files you provided. It is not
        professional financial or accounting advice. Do not rely on this score as a guarantee of
        data completeness.
      </p>

      {schemaFingerprint && (
        <section className="card diagnostic-card">
          <h3>Schema compatibility diagnostic</h3>
          <p className="note">
            Safe to share: this report contains filenames, headers, row counts, and detection
            metadata only — no customer names, amounts, or row contents.
          </p>
          <p className="note">{schemaFingerprint.launchGateReminder}</p>
          <div className="diagnostic-actions">
            <button type="button" className="btn-secondary" onClick={handleCopyDiagnostic}>
              {diagnosticCopied ? 'Copied!' : 'Copy diagnostic JSON'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleDownloadDiagnostic}>
              Download diagnostic JSON
            </button>
          </div>
        </section>
      )}

      <button className="btn-primary" onClick={onStartOver}>
        Check another archive
      </button>
    </div>
  )
}

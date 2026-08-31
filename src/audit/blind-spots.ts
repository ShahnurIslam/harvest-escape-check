import type { AuditFinding } from '../types/audit'

export const HARVEST_BLIND_SPOTS: Array<{
  id: string
  title: string
  explanation: string
}> = [
  {
    id: 'blind_spot.recurring_invoices',
    title: 'Recurring invoice configuration',
    explanation:
      'Recurring invoice schedules and templates may not be fully represented in standard bulk exports.',
  },
  {
    id: 'blind_spot.retainer_state',
    title: 'Retainer balances and state',
    explanation:
      'Retainer configuration and current balance may not be completely captured in CSV/XLSX exports.',
  },
  {
    id: 'blind_spot.project_config',
    title: 'Project configuration details',
    explanation:
      'Some project settings (budget alerts, invoice method, cost budget) may not appear in the projects export.',
  },
  {
    id: 'blind_spot.archived_teammates',
    title: 'Archived teammate completeness',
    explanation:
      'Archived or deactivated team members may not be fully represented in people exports.',
  },
  {
    id: 'blind_spot.account_settings',
    title: 'Account settings',
    explanation:
      'Company profile, tax settings, and account preferences are not included in data exports.',
  },
  {
    id: 'blind_spot.integrations',
    title: 'Third-party integrations',
    explanation:
      'Connected integrations (Slack, QuickBooks, etc.) and their configuration cannot be verified from exports.',
  },
  {
    id: 'blind_spot.report_config',
    title: 'Saved report configuration',
    explanation:
      'Saved and recurring report definitions may not be exported.',
  },
  {
    id: 'blind_spot.attachments',
    title: 'Invoice attachments and non-bulk assets',
    explanation:
      'Files attached to invoices, expenses, or projects outside bulk exports may not be included.',
  },
]

export function getBlindSpots(): AuditFinding[] {
  return HARVEST_BLIND_SPOTS.map((spot) => ({
    ruleId: spot.id,
    severity: 'info' as const,
    title: spot.title,
    explanation: spot.explanation,
    affectedRecords: [],
    sourceFiles: [],
    suggestedAction: 'Review these items manually in Harvest before cancelling, if they apply to your account.',
    category: 'blind_spot' as const,
  }))
}

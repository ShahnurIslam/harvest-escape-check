import { CHECKLIST_ITEMS, getCategoryLabel } from '../constants/checklist'
import { AffiliationNotice } from './AffiliationNotice'

interface ChecklistScreenProps {
  onContinue: () => void
}

export function ChecklistScreen({ onContinue }: ChecklistScreenProps) {
  return (
    <div className="screen">
      <header className="hero">
        <h1>Harvest Escape Check</h1>
        <AffiliationNotice />
        <p className="subtitle">
          Verify you have preserved enough of your Harvest data before cancelling your account.
        </p>
      </header>

      <section className="card">
        <h2>What to export from Harvest</h2>
        <p className="note">
          Harvest data is spread across multiple exports. Gather as many of these as apply to your
          account before running the check.
        </p>

        <ul className="checklist">
          {CHECKLIST_ITEMS.map((item) => (
            <li key={item.category} className={`checklist-item ${item.importance}`}>
              <span className="checklist-desc">
                <strong>{getCategoryLabel(item.category)}</strong> – {item.description}
              </span>
              <span className={`badge badge-${item.importance}`}>{item.importance}</span>
            </li>
          ))}
        </ul>

        <div className="limitation-note">
          <h3>Export limitations</h3>
          <p>
            Some Harvest configuration may not be available in standard exports and therefore cannot
            be fully verified automatically. This includes recurring invoice settings, retainer
            state, integrations, and account preferences.
          </p>
        </div>
      </section>

      <button className="btn-primary" onClick={onContinue}>
        Check my Harvest archive
      </button>

      <p className="disclaimer">
        This is a technical completeness check, not professional financial or accounting advice.
      </p>
    </div>
  )
}

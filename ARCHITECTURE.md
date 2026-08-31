# Harvest Escape Check – Developer Documentation

## Architecture

```
raw files
  → file detector (filename, MIME, headers, content)
  → parser (CSV/XLSX/PDF per export type)
  → normalised records (typed models with source refs)
  → audit rules (deterministic, rule-based)
  → readiness score
  → report UI
```

All processing happens in the browser. No files are uploaded to a server.

### Key modules

| Module | Path | Purpose |
|--------|------|---------|
| Detector | `src/detector/` | Classifies uploaded files by headers, filename, and type |
| Parsers | `src/parsers/` | Converts raw CSV/XLSX rows into typed records |
| Audit engine | `src/audit/` | Runs 26 deterministic rules against normalised data |
| Scoring | `src/scoring/` | Transparent penalty-based readiness score |
| Fixtures | `src/fixtures/` | Programmatic synthetic Harvest-shaped data |
| Pipeline | `src/pipeline/` | Orchestrates upload → detect → parse → audit |

## Supported files (V1)

| Export type | Formats | Detection method |
|-------------|---------|------------------|
| Time entries | CSV, XLSX | Headers: Date + Hours |
| Projects | CSV, XLSX | Headers: Project + Client |
| Clients | CSV, XLSX | Headers: Client |
| Client contacts | CSV, XLSX | Headers: Client + First/Last Name |
| Tasks | CSV, XLSX | Headers: Task |
| People/team | CSV, XLSX | Headers: First Name + Last Name |
| Expenses | CSV, XLSX | Headers: Amount |
| Invoice report | CSV, XLSX | Headers: Amount + Invoice fields |
| Invoice line items | CSV, XLSX | Headers: Amount + Invoice Number |
| Payments | CSV, XLSX | Headers: Amount + Invoice fields |
| Estimates | CSV, XLSX | Headers: Amount + Estimate fields |
| Invoice PDFs | PDF | Filename pattern: INV-#### |
| Estimate PDFs | PDF | Filename pattern: EST-#### |
| ZIP archives | ZIP | Extracted and processed individually |

Unknown files are reported but not rejected.

## Known assumptions

These are inferred from public Harvest documentation and synthetic fixtures. **They are not verified against real Harvest exports.**

1. **Column names** – We expect headers like "Date", "Hours", "Client", "Project", "Invoice Number", etc. Real exports may use different naming.
2. **Date formats** – We handle ISO (YYYY-MM-DD) and DD/MM/YYYY. Other formats may need additional support.
3. **PDF naming** – We assume invoice PDFs follow `INV-####.pdf` and estimates `EST-####.pdf`. Real naming may differ.
4. **Identifier fields** – We look for "Invoice Id", "Project Id", etc. Harvest may use different ID column names.
5. **XLSX structure** – We read the first sheet only. Multi-sheet workbooks are not fully supported.
6. **Currency** – We expect 3-letter ISO codes. Unusual formats are flagged.
7. **ZIP contents** – Flat extraction; nested folder structures may need handling.

## Fixture matrix

See `src/fixtures/generator.ts` → `DAMAGED_DEFECTS` for the full mapping of planted defects to expected audit rules.

| Fixture | Defect | Expected rule |
|---------|--------|---------------|
| Damaged | Missing invoice PDFs (INV-0184, INV-0191) | `invoice.missing_pdf` |
| Damaged | Duplicate invoice row | `invoice.duplicate` |
| Damaged | Line item → unknown invoice INV-9999 | `integrity.line_item_missing_invoice` |
| Damaged | Payment → unknown invoice INV-8888 | `integrity.payment_missing_invoice` |
| Damaged | Invoice total mismatch INV-0050 | `invoice.total_mismatch` |
| Damaged | Missing project "Ghost Project Alpha" | `integrity.missing_project` |
| Damaged | Time entry → missing project | `integrity.time_missing_project` |
| Damaged | Time entry → missing task "Phantom Task" | `integrity.time_missing_task` |
| Damaged | Expense → missing project | `integrity.expense_missing_project` |
| Damaged | Duplicate time entry | `quality.duplicate_time_entry` |
| Damaged | Payments export removed | `archive.missing_export` |
| Damaged | Expenses export removed | `archive.missing_export` |
| Damaged | Estimate PDF EST-0010 removed | `estimate.missing_pdf` |
| Damaged | Duplicate clients.csv upload | `quality.duplicate_files` |
| Damaged | Inconsistent client naming | `quality.inconsistent_client_naming` |
| Damaged | Blank invoice identifier | `quality.blank_identifier` |
| Damaged | Invalid date "not-a-date" | `quality.invalid_date` |
| Damaged | Currency "POUND" instead of ISO | `invoice.unexpected_currency` |
| Damaged | Overpayment on INV-0075 | `invoice.overpayment` |
| Damaged | random_notes.txt uploaded | `quality.unknown_files` |

## Schema fingerprint diagnostic

After upload, the results screen offers a **schema compatibility diagnostic** (copy/download JSON).
It reports filenames, headers, row counts, sheet names, date-format patterns, and detection metadata —
without row values, names, emails, amounts, or descriptions. Safe to share with developers for
compatibility triage.

See `src/diagnostic/schema-fingerprint.ts` and `COMPATIBILITY_EVIDENCE.md` for public-source research.

## Before production launch

> **The product must be tested against at least one genuine Harvest archive from a real account.**

Synthetic tests prove our engine works. They do **not** prove complete compatibility with Harvest.

We need to validate:

- [ ] Actual export filenames Harvest uses
- [ ] Actual CSV/XLSX column headers
- [ ] Date format variations in real exports
- [ ] Identifier field names and formats
- [ ] File encoding (UTF-8, BOM handling)
- [ ] XLSX structure (sheets, formatting)
- [ ] PDF naming conventions
- [ ] Export variations (date ranges, filters, archived data)
- [ ] Behaviour with deactivated/archived projects and people

## Running locally

```bash
npm install
npm run dev      # Start dev server
npm test         # Run test suite
npm run build    # Production build
npm run lint     # Lint
```

## Privacy

Harvest Escape Check processes uploaded files **locally in the browser**. The application source contains no `fetch`, `XMLHttpRequest`, analytics, telemetry, or remote logging calls.

**Privacy guarantee:** uploaded Harvest files and their contents are processed locally and are not transmitted by Harvest Escape Check.

Automated tests in `src/privacy/local-processing.test.ts` verify the application source excludes network/telemetry APIs and that archive processing does not call `fetch`.

The only user-initiated outbound action is optional: copying or downloading the schema fingerprint diagnostic JSON (designed to exclude business data).

Running `npm run dev` serves application code via a local Vite server; uploaded files are not sent to that server.

A GitHub Pages host may receive ordinary HTTP requests used to serve the website. Archive contents are still processed in the browser and are not sent to GitHub Pages by the application.

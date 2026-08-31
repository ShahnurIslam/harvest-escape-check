# Harvest Escape Check

**Independent tool for checking Harvest exports. Not affiliated with Harvest.**

> **Version 0.1.0-alpha** — public alpha for compatibility validation. Not production-compatible with all Harvest accounts.

## Alpha compatibility status

Harvest Escape Check is currently being validated against genuine Harvest exports.

Synthetic benchmark coverage and public schema research do **not** guarantee compatibility with every Harvest account or historical export format.

We are looking for early testers who are currently exporting data from Harvest. If an export is not recognised, you can share the **schema-only diagnostic** from the results screen rather than your commercial files.

Harvest Escape Check helps people leaving [Harvest](https://www.getharvest.com/) inspect the completeness of their exported archive before cancelling their account.

## What it is

A local, browser-based audit tool that:

1. Accepts your Harvest export files (CSV, XLSX, ZIP, PDF)
2. Detects and parses each export type
3. Runs deterministic completeness and integrity checks
4. Produces a readiness score and actionable findings
5. Can generate a **schema-only diagnostic** you can share safely if something is not recognised

## What it is not

- **Not affiliated with Harvest** — this is an independent open-source project
- **Not a Harvest replacement** — it does not track time, invoice clients, or manage projects
- **Not a migration service** — it does not move data to another product
- **Not accounting software** — it is a technical completeness check, not financial advice
- **Not a guarantee** — passing the check does not prove every Harvest feature, setting, or integration has been preserved
- **Not production-ready** — this alpha release has not been validated against every real Harvest export configuration

## Privacy

**Uploaded Harvest files and their contents are processed locally and are not transmitted by Harvest Escape Check.**

Specifically:

- Files are read from your device using the browser File API
- All detection, parsing, auditing, and scoring happen in memory in your browser
- No Harvest credentials or API keys are required
- No analytics, telemetry, or error-reporting services are included in the application
- You can inspect the [source code](./src/) to verify this behaviour
- You can run the application entirely on your own machine (see below)

The only user-initiated action that leaves your browser is optional: copying or downloading the **schema fingerprint diagnostic** JSON to your clipboard or disk. That diagnostic is designed to exclude customer names, amounts, and row contents.

A hosted alpha is available at [https://harvest.shanislam.com/](https://harvest.shanislam.com/). GitHub Pages necessarily receives ordinary HTTP requests needed to serve the website, but Harvest archive contents are processed in the browser and are not sent to GitHub Pages by the application.

> **Note:** Running `npm run dev` starts a local development server that serves application code to your browser; it does not receive your uploaded files. Hosting providers may log ordinary page requests separately from this application’s local-processing behaviour.

## Local development

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically http://localhost:5173).

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm test` | Run test suite |
| `npm run build` | Production build (output in `dist/`) |
| `npm run lint` | Lint with oxlint |
| `npm run preview` | Preview production build locally |

## Architecture

```
raw files
  → detector (filename, MIME, headers)
  → parser (CSV / XLSX / PDF per export type)
  → normalised records (typed models with source references)
  → deterministic audit rules (26 rules)
  → readiness score + report
  → optional schema fingerprint diagnostic
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for module details, supported export types, and the synthetic fixture matrix.

## Compatibility status

This is an **early alpha** (0.1.0-alpha) focused on compatibility validation.

- **Synthetic benchmarks pass** — programmatic fixtures verify the audit engine end-to-end
- **Some schemas supported by public evidence** — see [COMPATIBILITY_EVIDENCE.md](./COMPATIBILITY_EVIDENCE.md)
- **Genuine Harvest archive validation is still in progress** — we have not yet verified against a real customer export from the current Harvest product

Export formats may vary by account configuration, date range, and filters. Do not rely on this alpha as proof that your archive is complete.

## Safe compatibility reports

If the tool does not recognise an export, use the **schema compatibility diagnostic** on the results screen. See [SECURITY.md](./SECURITY.md) before posting diagnostics publicly.

**Contains (safe to share):**

- Filenames (with optional sanitised variants)
- File extensions
- Detected export type and detector confidence
- Column / header names
- Row counts
- XLSX sheet names and sheet count
- Inferred date-format patterns (e.g. `YYYY-MM-DD`, not actual dates)
- Presence / absence of expected columns
- Parser warning messages (generic)
- Redacted PDF filename patterns
- ZIP member extension summaries

**Does not contain:**

- Customer, employee, or contact names
- Email addresses or postal addresses
- Invoice descriptions, notes, or time-entry notes
- Monetary values or hours
- Raw rows or cell values

Please share diagnostics — not raw Harvest exports — when reporting compatibility issues. Use the [compatibility issue template](.github/ISSUE_TEMPLATE/compatibility_report.yml).

## Contributing

Contributions are welcome, especially:

- Real-world **schema variations** (via diagnostics, not raw exports)
- Parser / detector fixes backed by public evidence or redacted diagnostics
- Additional audit rules with tests
- Documentation improvements

**Please do not commit genuine commercial Harvest exports** containing personal, customer, or business data. Use the synthetic fixture generator in `src/fixtures/generator.ts` or share schema-only diagnostics instead.

1. Fork the repository
2. Create a branch
3. Add tests for your change
4. Run `npm test` and `npm run lint`
5. Open a pull request describing the Harvest export variation you are addressing

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — pipeline, supported files, assumptions
- [COMPATIBILITY_EVIDENCE.md](./COMPATIBILITY_EVIDENCE.md) — public-source evidence matrix
- [SECURITY.md](./SECURITY.md) — privacy and security reporting
- [FUTURE.md](./FUTURE.md) — deliberately excluded scope

## Licence

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE).

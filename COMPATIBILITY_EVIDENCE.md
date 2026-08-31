# Harvest Export Compatibility Evidence

Public-source evidence gathered during the real-world compatibility spike (Aug 2026).
Synthetic fixture assumptions are **not** treated as verified.

**Launch gate (unchanged):** before production launch, validate against at least one genuine Harvest archive.

## Evidence matrix

| Export | Current assumed schema | Public evidence found | Confidence | Required change |
|--------|------------------------|----------------------|------------|-----------------|
| Time entries (detailed report) | `Date`, `Hours`, `Client`, `Project`, `Task`, `Billable?`, `First Name`, `Last Name`, optional `Employee Id`, `Notes`, `Currency` | [harvest-to-kimai](https://github.com/jonmunson/harvest-to-kimai): `Date`, `First Name`, `Last Name`, `Hours`, `Client`, `Project`, `Task`, `Notes`, `Billable Rate`. [harvest-csv-analysis](https://github.com/jon-the-dev/harvest-csv-analysis): `Date`, `Client`, `Project`, `Task`, `Hours`, `Billable?`, `First Name`, `Last Name`. [harvest-overtime](https://github.com/flandrade/harvest-overtime) sample: `Employee?`, `First Name`, `Last Name`, `Date`, `Hours`. [Harvest import docs](https://support.getharvest.com/hc/en-us/articles/360048685111): `Date`, `Client`, `Project`, `Task`, `Notes`, `Hours`, `First name`, `Last name`. [org-clock-csv](https://github.com/caleb/org-clock-csv): import format `Date,Client,Project,Task,Notes,Hours,First name,Last name` | VERIFIED_IMPLEMENTATION | Added optional header aliases: `Employee?`, `Billable Rate` |
| Time entries (summary report) | Same detector as detailed | [harvest-overtime](https://github.com/flandrade/harvest-overtime) uses subset without Client/Project/Task | VERIFIED_PUBLIC_SAMPLE | No change — subset still matches `Date`+`Hours` signature |
| Projects | `Project`, `Client`, optional `Project Id`, `Code`, `Active`, `Currency` | API v2 project object has `name`, `client`, `code`, `is_active`, `is_billable` ([docs](https://help.getharvest.com/api-v2/projects-api/projects/projects/)). No public CSV fixture found. | DOCUMENTED | No CSV change yet — await real export |
| Clients | `Client`, optional `Client Id`, `Currency`, `Address` | API v2 client object ([docs](https://help.getharvest.com/api-v2/clients-api/clients/clients/)). [getharvest-backup](https://github.com/tektit/getharvest-backup) backs up JSON, not CSV headers. | DOCUMENTED | No CSV change yet |
| Client contacts | `Client`, `First Name`, `Last Name`, optional `Email` | API v2 contacts endpoint referenced by [getharvest-backup](https://github.com/tektit/getharvest-backup). No public CSV sample. | DOCUMENTED | No change |
| Tasks | `Task`, optional `Task Id`, `Project` | Harvest import docs: tasks created indirectly via zero-hour time imports, not direct CSV export. API v2 tasks endpoint exists. | DOCUMENTED | No change |
| People / team | `First Name`, `Last Name`, optional `User Id`, `Email`, `Role` | [harvest-overtime](https://github.com/flandrade/harvest-overtime) uses name columns. API v2 users endpoint. | INFERRED | Added optional `Employee?` alias |
| Expenses | `Amount`, `Date`, optional `Project`, `Client`, `Notes`, `Currency` | [Harvest import docs](https://support.getharvest.com/hc/en-us/articles/360048685111): `Date`, `Amount`, `Units`, `Client`, `Project`, `Category`, `Notes`, `First name`, `Last name`, `Billable` | DOCUMENTED | Added optional `Units`, `Spent Date` aliases |
| Invoice report | `Amount`, optional `Invoice Id`, `Invoice Number`, `Client`, `Issue Date`, `Due Date`, `Status`, `Currency` | API v2 invoice object: `id`, `number`, `client`, `issue_date`, `due_date`, `amount`, `currency`, `state` ([docs](https://help.getharvest.com/api-v2/invoices-api/invoices/invoices/)). No public CSV report fixture. | DOCUMENTED | No change |
| Invoice line items | `Amount`, `Invoice Number`, optional `Description`, `Quantity`, `Unit Price` | API v1 `csv-line-items` field on invoice show ([docs](https://help.getharvest.com/api-v1/invoices-api/invoices/show-invoices/)): `kind,description,quantity,unit_price,amount,taxed,taxed2,project_id` | DOCUMENTED | No change — API CSV differs from report export |
| Payments | `Amount`, optional `Invoice Number`, `Paid Date`, `Currency` | API v2 invoice payments endpoint ([docs](https://help.getharvest.com/api-v2/invoices-api/invoices/invoice-payments/)). No public CSV fixture. | DOCUMENTED | No change |
| Estimates | `Amount`, optional `Estimate Id`, `Estimate Number`, `Client`, `Issue Date`, `Status` | API v2 estimates endpoint. [getharvest-backup](https://github.com/tektit/getharvest-backup) downloads estimate PDFs via API. | DOCUMENTED | No change |
| Invoice PDFs | `INV-####.pdf`, `invoice*.pdf` | [harvest-axi](https://github.com/JarvusInnovations/harvest-axi): downloads as `invoice-<number>-<id>.pdf`. [getharvest-backup](https://github.com/tektit/getharvest-backup): stores PDFs from API. | VERIFIED_IMPLEMENTATION | Added `invoice-<number>-<id>.pdf` pattern |
| Estimate PDFs | `EST-####.pdf`, `estimate*.pdf` | Inferred from invoice pattern symmetry. No public sample filename found. | INFERRED | Added `estimate-<number>` prefix pattern |
| ZIP archives | Flat extraction, basename only | Common user behaviour; no Harvest-specific public spec. | INFERRED | No change |
| XLSX exports | First sheet only | Harvest marketing mentions CSV/XLSX export ([export timesheet](https://www.getharvest.com/time-tracking/export-timesheet)). Sheet naming unknown. | DOCUMENTED | Diagnostic now reports sheet names/count |

## Public sources consulted

| Source | Type | URL |
|--------|------|-----|
| harvest-to-kimai | Migration script + header list | https://github.com/jonmunson/harvest-to-kimai |
| harvest-csv-analysis | CSV consumer app | https://github.com/jon-the-dev/harvest-csv-analysis |
| harvest-overtime | CSV sample + required headers | https://github.com/flandrade/harvest-overtime |
| org-clock-csv | Harvest import CSV format | https://github.com/caleb/org-clock-csv |
| hamster-to-harvest | Harvest import CSV format | https://github.com/olange/hamster-to-harvest |
| getharvest-backup | API backup tool (JSON + PDFs) | https://github.com/tektit/getharvest-backup |
| harvest-axi | CLI invoice PDF download naming | https://github.com/JarvusInnovations/harvest-axi |
| dedene/harvest-cli | Bulk CSV export command | https://github.com/dedene/harvest-cli |
| Harvest import docs | Official import column spec | https://support.getharvest.com/hc/en-us/articles/360048685111 |
| Harvest API v2 docs | JSON field names (not export CSV) | https://help.getharvest.com/api-v2/ |

## Schema fingerprint diagnostic

See `src/diagnostic/schema-fingerprint.ts`. Available from the results screen after upload.
Produces JSON safe to share — no row values, names, emails, amounts, or descriptions.

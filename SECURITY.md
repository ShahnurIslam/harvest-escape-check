# Security and privacy

Harvest Escape Check is designed so that **uploaded Harvest files and their contents are processed locally in your browser and are not transmitted by the application**.

## Reporting security or privacy issues

Please **do not** report security or privacy concerns by posting sensitive Harvest data publicly.

That includes:

- Raw Harvest export files (CSV, XLSX, ZIP, PDF)
- Client, employee, or contact names from real accounts
- Invoice contents, time-entry notes, amounts, or email addresses from live data
- Full archive dumps attached to GitHub issues

Instead, please provide **reproducible technical details**, such as:

- Harvest Escape Check version
- Browser and operating system
- Steps to reproduce (using synthetic or redacted examples)
- A **schema-only diagnostic** JSON from the results screen (inspect it first if you have any concerns)

Until a dedicated security contact exists, open a **GitHub issue** for non-sensitive reports using the bug report template. Do not include commercial Harvest data in the issue body or attachments.

## What we treat as in scope

- Unexpected network transmission of uploaded archive contents
- Schema diagnostic leaking business data that should have been redacted
- Other defects in local-processing or privacy-related behaviour

## What belongs elsewhere

- Harvest account security (use [Harvest support](https://www.getharvest.com/))
- General compatibility questions without a security angle (use the compatibility issue template)

Thank you for helping keep user data private.

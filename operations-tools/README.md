# Operations subsites

Static GitHub Pages apps at `/sla-check/` and `/spend-check/`. Open them through any static HTTP server (for example `python3 -m http.server 8000`). There is no build step, backend, account, external library, analytics, or persistent browser storage. Only local CSS and JavaScript are loaded. Files are processed in memory; refreshing or closing the tab discards the session.

SpendCheck offers manual entry, an editable USD purchase ledger, six generic hardware budget specifications, CSV import/export, supplier and tail-spend totals, payment balances, duplicate candidates, SKU/unit price variance, explicit vendor alias merges, and an RFQ worksheet. Hardware prices are fictional examples, not live quotes. Estimates are excluded from booked spend. A row represents one invoice line; users must allocate invoice-level tax, freight, and payments across lines. Credits, currency conversion, and journal entries are outside this tool's scope.

SLAcheck provides editable P1–P4 response/resolution rules, a report cutoff, manual ticket entry, CSV import, vendor scorecards, ticket audits, repeat-issue grouping, corrective-action exports, and a separate availability calculator. Timers use continuous elapsed time from ticket opening, with inclusive deadlines. Pending checks are excluded from compliance; overdue open checks count as breached. Contract extraction, business-hour calendars, pause rules, integrations, and contractual service-credit determination are not implemented. Rules can be exported for reference and reentered in a new session.

Both pages include blank CSV templates and a fictional example dataset. Imports validate the entire file before replacing data. CSVs support quoted commas, escaped quotes, embedded newlines, and UTF-8 BOMs; exports neutralize spreadsheet formula prefixes. Limit: 10 MB and 10,000 rows. Ticket/ledger views show the first 200 rows, supplier/variance tables the first 100, and review/action/repeat lists the first 50. CSV exports include the complete corresponding data. Browser printing captures the displayed report; use CSV exports for full large-dataset evidence.

Core regression tests are in `tests.js`. Load `core.js` in a browser, evaluate `tests.js`, then run `runOpsTests()`; each result includes a name and pass/fail value. These cover CSV correctness, validation, monetary rounding, bookkeeping exclusions, duplicate review, SKU grouping, and SLA snapshot/deadline semantics.

Deployment follows the existing repository's GitHub Pages workflow. New links are included in the main homepage and sitemap.

# Beyond Traditional Leather — marketing dashboard

A personal dashboard for Laura Carrillo's early-stage plant-based work glove concept for the oil and gas industry. Uses the supplied brochure's forest green, olive, slate, and white palette. Laura is the sole editor. Local use and sharing reports need no account; optional private cloud sign-in/backups use Supabase and require the [one-time setup](cloud/SETUP.md).

## Run locally

### View as a website with GitHub Pages

The completed dashboard is also included as the self-contained `docs/index.html`, ready to serve as a website. In the GitHub repository, an owner/admin must open **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/docs**, then click **Save**. This task cannot enable that setting because GitHub's settings API is inaccessible from the execution environment.

After GitHub reports a successful Pages deployment, use the website address shown in that Pages settings screen. The expected project address is `https://jaw6027.github.io/MGMT-3450-Team-6/`, but it must not be treated as live until deployment and the page have been verified. The environment's network proxy currently blocks requests to that hostname, so public availability has not been verified here.

The website serves the application and its clearly labeled demo records. Laura's personal records remain in her browser unless she explicitly uses configured cloud backup. Hosting does not activate Supabase sign-in or cloud backup; their separate one-time setup remains necessary. Data stored in a downloaded-file browser context does not automatically move to the website's browser storage: download a complete JSON backup in the old dashboard, then restore it in the website version.

After future app changes, run `npm run build:pages`, validate the generated page, and commit the refreshed `docs/` files. GitHub Pages deploys committed contents of `/docs`; it does not run npm automatically in branch mode.

### Development

Requires Node.js 20.19+ or 22.12+ (tested with Node 24).

```sh
npm ci --cache /tmp/team6-npm-cache
npm run dev
```

Vite listens on port 5173 by default and binds to all interfaces. For local use, no API keys, database, or external services are required. Fonts are bundled locally. Use `npm run build` to produce `dist/`; `npm run preview` serves that build.

## Sharing, complete backups, and private sign-in

Open **Share & backup** to download a read-only report for others, download a complete private JSON backup (including goals and campaign spending), or restore one with a preview and explicit confirmation. Reports follow the current filters and exclude private lead rows/notes; optional planning details require a checkbox. Complete backups include all personal data and are intended for private recovery. No public sharing link is created, and files are never sent to anyone automatically.

Secure email-code sign-in, optional automatic cloud snapshots, and cloud restore are implemented for Supabase. They are **not active until Laura's project, Auth user/email delivery, database security policies, and public connection configuration are set up**. See [cloud/SETUP.md](cloud/SETUP.md) and [cloud/supabase.sql](cloud/supabase.sql). No live cloud provider was connected or live email delivery tested during development. Signing in protects cloud copies; local browser records remain available on the device. Backup is distinct from automatic multi-device editing/synchronization.

## What works

- Date, first-touch channel, and buyer role filters update every metric and chart.
- Customer journey, message comparison, and trial feedback views derive from the same lead records.
- **What's getting the most interest?** summarizes the leading audience, message, and marketing channel by sample-request count within the current filters. Sample requested, in trial, and feedback received each count once per lead. Ties are explicit, zero requests produce no leader, and an empty selection prompts broader filters. Each single leader shows requests, inquiries, and its request rate for context; the ranking uses volume, not rate or causal effectiveness. Demo and imported summaries are labeled separately.
- Search the follow-up table; the first eight matching leads are displayed. Narrow filters or search to find other leads.
- Add leads directly, then edit buyer information, stage, owner, next action, follow-up date, sample milestones, trial ratings, and buyer comments. Updates persist in this browser's local storage; they are not shared across devices. Clearing site data resets saved information.
- Export all leads matching the three dashboard filters to CSV, including saved follow-up updates. Company search only narrows the on-screen table, not the export.
- Import real lead records from CSV with validation and a preview before replacing the active data. Custom channels, buyer roles, and messages appear in the dashboard automatically.

## Laura's personal workbench

- **Add lead:** opens a buyer conversation form. Saving the first personal lead while viewing demo data creates a separate personal list containing that lead; it never copies fictional buyers into Laura's real list. Existing imported leads can be edited and new leads added to that list. Required fields are company, buyer role, channel, inquiry date, and stage. Owner defaults to Laura.
- **Follow-up reminders:** choose a date and next action in the lead editor. The workbench lists overdue, due-today, and upcoming follow-ups through the next seven days, across all active leads. Calendar dates use America/Los_Angeles. **Done** removes an item from the reminder list without deleting its date; uncheck **Follow-up complete** in the lead editor to reopen it. These are on-dashboard reminders, not email or push notifications.
- **Sample tracker:** record actual requested, sent, received, and evaluated dates in each lead. Dates must not precede the inquiry, each later milestone needs its predecessor, and milestones must be chronological. Select Sample requested or a later stage first. A stage alone does not fabricate shipping dates; missing dates are labeled as not recorded. Search samples by company; the first eight matches are displayed.
- **Buyer feedback:** record optional comfort, grip, durability, price, and purchasing-concern comments. Ratings remain optional 1–5 values and require Feedback received. Missing ratings are excluded from means. Text comments are shown in expandable buyer notes, with an edit button; the first six records with comments are shown, and other records can be found in the lead table. Comments and ratings do not establish certified safety performance.
- **Personal goals:** editable targets for buyer conversations, sample requests, and feedback responses. Starter targets are 20/10/5. Progress uses all active leads, independent of dashboard filters; counts above target remain visible while the progress bar caps at 100%. Goals are planning targets, not forecasts.
- **Campaign costs:** add a campaign name, channel, and actual cumulative total spent in USD. Update this single total as spending changes; do not repeat it per lead. Assign each relevant lead to its campaign through **Campaign for cost tracking**. Cost per sample request divides campaign spend by unique assigned leads at Sample requested or later. It displays Not available when no requests are assigned. Spend and attribution use all dates and active leads, independent of dashboard filters. Unassigned/unknown campaign IDs are reported and excluded from campaign results. Use **Export costs** for a separate campaign CSV, including the IDs needed for lead attribution. No spending is fabricated.

Demo and personal planning settings are isolated. Goals and campaign costs remain in place when the lead CSV is replaced, so existing campaign IDs can be reused. Lead CSV exports include follow-up dates/completion, sample dates, comments, and campaign IDs; campaign totals are intentionally exported separately. A complete JSON backup includes both leads and planning settings for one-step recovery. Configured cloud copies include the same full data. There is no automatic multi-device merge or background reminder service.

## Laura's CSV workflow

1. Click **Import CSV**, then **Download CSV template**.
2. Fill in one row per buyer conversation in Excel or Google Sheets. Keep the column headers; save as **CSV (comma delimited / UTF-8)**, not XLSX or a semicolon-delimited file.
3. Choose the CSV. Fix any reported lead-row errors, review the lead count, then click **Import records**. Invalid imports leave existing records untouched; files are accepted as a whole, without silently skipping rows.
4. The dashboard switches from demo to imported data and selects all imported dates. Importing replaces the previous imported records and their saved edits; export them first if needed. It never mixes real records with demo leads. Reimporting the same file replaces rather than duplicates its rows.
5. Export updated records to share or back up the file. Reopen **Import CSV → Use demo data** to remove the imported data and its edits from this browser and restore the demo.

Required columns: `Company`, `Buyer role`, `Channel`, `Inquiry date`, `Current stage`. Header names and stages are case-insensitive. Dates must be valid `YYYY-MM-DD` dates. Stages: `Inquiry`, `Qualified`, `Sample requested`, `In trial`, `Feedback received`.

Optional columns: `Lead ID`, `Campaign/message`, `Comfort`, `Grip`, `Durability`, `Next action`, `Owner`, `Follow-up date`, `Follow-up complete`, `Sample requested date`, `Sample sent date`, `Sample received date`, `Sample evaluated date`, `Comfort notes`, `Grip notes`, `Durability notes`, `Price notes`, `Purchasing concerns`, `Campaign ID`. The legacy `Team owner` column is still accepted for compatibility. Each lead ID must be unique; blank IDs are generated. Blank message and owner values become `Unspecified` and `Unassigned`. Follow-up complete accepts Yes/No/True/False or blank. Optional dates use YYYY-MM-DD. Ratings must be numbers from 1 to 5 or blank and require the `Feedback received` stage. Partial ratings are supported: each average excludes missing values and displays its own response count. A feedback-stage lead can have no ratings yet. The original export's JSON `Feedback` column is also supported. Extra columns are ignored; they are not retained in exports.

Limits: 5 MB and 5,000 leads per file. Supported CSV features include UTF-8 BOM, quoted commas, escaped quotes, multiline fields, and CRLF/LF line endings. For imported data, the last 7/30-day filters end at the latest inquiry date in the CSV, displayed beside the filters; all dates includes every record. No date values or ratings are invented.

Imports and follow-up edits are saved in this browser's local storage and survive reload. They are uploaded only when Laura connects, signs in, and uses cloud backup; there is no automatic multi-device merge. Clearing browser/site data removes them; export a CSV backup. If storage is unavailable or full, the import is rejected without replacing active records. Imported data is treated as text when rendered, and CSV exports protect against spreadsheet formula execution.

### Downloadable standalone dashboard

Run `npm run build:standalone` to create `dist/Plant-Based-Leather-Dashboard.html` with scripts, styling, and fonts included. This file can be downloaded for local browser use. Its local-storage availability depends on browser policy. Cloud Chromium blocks `file://` navigation, so the standalone artifact is validated over HTTP with the same browser suites:

```sh
# With npm run preview -- --port 4173 running:
TEST_URL=http://127.0.0.1:4173/Plant-Based-Leather-Dashboard.html npm run test:browser
```

## Data and definitions

The initial 48 lead records, organization names, channel results, and buyer ratings are fictional classroom demonstration data. The demo snapshot is fixed at November 17, 2026; periods are inclusive (last 7 days: Nov 11–17; last 30 days: Oct 19–Nov 17). CSV imports replace this demo with user-supplied records and display an imported-data label. Neither mode is a live analytics feed.

Data lives in `src/data.js`; presentation and interactions are in `src/main.js`, with responsive styling in `src/style.css`.

- **Inquiries:** unique lead records in the selected cohort.
- **Qualified:** leads reaching qualified or any later stage.
- **Sample requests:** leads reaching sample requested or any later stage.
- **Trial feedback:** leads reaching feedback received.
- **Sample conversion:** sample requests divided by qualified leads; 0% when none qualify.
- **Journey:** cumulative stages reached by the inquiry-date cohort, not events occurring within the selected period.
- **Channels:** one first-touch source per lead.
- **Message comparison:** sample requests divided by inquiries assigned to each message. Descriptive only, not evidence of causal lift.
- **Ratings:** arithmetic means of available feedback on a 1–5 scale, not certified glove tests.

The supplied brochure is project context, not independently verified product evidence. Supplier material figures are not converted to per-glove savings; measurement basis and certification scope require confirmation. Finished-glove safety testing is pending. The dashboard's leaf is decorative artwork, not a product photograph.

No marketing spending or revenue is fabricated. Campaign spending is entered and stored separately from lead records to avoid counting it once per lead. The dashboard is for Laura's personal use; team access is outside the requested scope.

## Validation

```sh
npm test
npm run build
# In another terminal, with npm run dev running:
npm run test:browser
```

Browser checks use `/usr/bin/chromium`; override `CHROMIUM_PATH` for another Chromium executable and `TEST_URL` to test a production preview. Checks cover combined filters, persisted follow-up edits, filtered CSV export, search, mobile width, dialog behavior, and browser runtime errors. Screenshots are saved outside the repository in `/tmp/beyond-dashboard-{desktop,mobile}.png`.

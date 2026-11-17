# Beyond Traditional Leather — marketing dashboard

A one-page dashboard for Team 6's early-stage plant-based work glove concept for the oil and gas industry. Uses the supplied brochure's forest green, olive, slate, and white palette.

## Run locally

Requires Node.js 20.19+ or 22.12+ (tested with Node 24).

```sh
npm ci --cache /tmp/team6-npm-cache
npm run dev
```

Vite listens on port 5173 by default and binds to all interfaces. No API keys, database, or external services are required. Fonts are bundled locally. Use `npm run build` to produce `dist/`; `npm run preview` serves that build.

## What works

- Date, first-touch channel, and buyer role filters update every metric and chart.
- Customer journey, message comparison, and trial feedback views derive from the same lead records.
- Search the follow-up table; the first eight matching leads are displayed. Narrow filters or search to find other leads.
- Edit each lead's owner and next action. Updates persist in this browser's local storage; they are not shared across users or devices. Clearing site data resets edits.
- Export all leads matching the three dashboard filters to CSV, including saved follow-up updates. Company search only narrows the on-screen table, not the export.

## Data and definitions

All 48 lead records, organization names, channel results, and buyer ratings are fictional classroom demonstration data. The snapshot is fixed at November 17, 2026; periods are inclusive (last 7 days: Nov 11–17; last 30 days: Oct 19–Nov 17). This is not a live analytics feed.

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

No marketing spending or revenue is fabricated. If added later, campaign spending should use a separate table to avoid counting it once per lead. Before connecting actual data, replace demo records through an agreed data source and add authentication and appropriate access controls for real buyer information. Current local storage is intended for demonstration only.

## Validation

```sh
npm test
npm run build
# In another terminal, with npm run dev running:
npm run test:browser
```

Browser checks use `/usr/bin/chromium`; override `CHROMIUM_PATH` for another Chromium executable and `TEST_URL` to test a production preview. Checks cover combined filters, persisted follow-up edits, filtered CSV export, search, mobile width, dialog behavior, and browser runtime errors. Screenshots are saved outside the repository in `/tmp/beyond-dashboard-{desktop,mobile}.png`.

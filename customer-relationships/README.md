# Laura’s plant-based PPE customer relationships

A separate CRM website for Laura’s prospective industrial PPE buyers. Marketing and product-development dashboards keep their existing records and workflows.

From the repository root, use Node 20.19+ or 22.12+ (Node 24 tested):

```sh
npm ci --cache /tmp/team6-npm-cache
npm run dev:crm
```

Vite serves the CRM on port 5175. `npm run build:crm` builds the app and a self-contained `dist-crm/Laura-PPE-Customer-Relationships.html`. `npm run build:crm:pages` also refreshes `docs/customer-relationships/index.html`. `npm run build:websites` builds all three sites. The existing GitHub Pages branch deployment can serve the CRM under `/customer-relationships/` once GitHub completes deployment; committing the generated page does not verify that the public website is live.

## Everyday workflow

- **Explore demo** contains six explicitly fictional, read-only accounts, using a fixed November 22, 2026 snapshot. No example organization is a verified prospect or customer.
- **My customers** starts empty. Add a company, contact details, segment, buyer role, priority, PPE needs, sample status, and next action/date. Adding from demo starts personal records without copying demo accounts. Company is required; contact, email, PPE needs, and notes may remain unknown. A follow-up date needs a next action.
- Record the current relationship stage: Target identified, Contacted, Needs discussion, Sample evaluation, Proposal, Customer, or Not a fit. Stages are entered by Laura; a sample does not imply a purchase. Use Not a fit to retain a closed prospect’s history.
- Open an account to edit details or log a dated call, email, meeting, sample-feedback conversation, or other interaction. Logging a conversation saves immediately; editing account fields requires **Save customer**. After a conversation, update the next action and date to move the reminder forward or clear the date to remove it from the dated follow-up list. There are no email/push reminders.
- Search companies, contacts, emails, PPE needs, or next actions. Combine with segment, stage, and due-date filters. Pipeline stage buttons toggle the stage filter. Counts, pipeline, follow-up list, and CSV reflect the same filters. The follow-up list shows the earliest eight dated open accounts; all accounts remain available in the table. Personal due dates use the America/Los_Angeles calendar day. Customer and Not a fit accounts are excluded from open/due/sample-in-progress counts.
- **Export filtered CSV** downloads account details for the current view. It excludes conversation history; use the complete JSON backup to retain it. CSV cells are quoted and spreadsheet formula prefixes are escaped. CSV import is not supported.
- **Complete backup** downloads all records in the selected demo/personal workspace, independent of filters, with conversation history. Keep personal files private. **Restore backup** validates a CRM JSON file and shows a count before explicit replacement of personal CRM records only. Marketing and product backups are rejected. Cancel leaves saved data unchanged.

Records are stored locally under `laura-ppe-crm-v1`. No account, database, or API keys are required. No background sync, marketing-lead import, cloud backup, or automatic contact outreach is provided. Browser data clearing removes records: download backups regularly. Limits: 1,000 accounts, 200 conversations per account, and 4 MB per backup/save. Invalid or quota-rejected writes leave current records untouched; unreadable saved data is preserved and blocks replacement saves to avoid accidental loss.

Suggested discovery contacts are safety/HSE managers, procurement teams, industrial distributors, and sustainability leads. Segment and role describe different things. Priority is Laura’s judgment, not an invented buyer score. PPE protection/certification and supplier environmental claims need evidence; recording needs, sample feedback, or a customer stage does not certify finished gloves.

## Validation

```sh
npm test
# With npm run dev:crm running:
npm run test:crm:browser
```

Chromium defaults to `/usr/bin/chromium`; override `CHROMIUM_PATH` if needed. Set `CRM_TEST_URL` to test a production or standalone page instead. Browser checks cover demo isolation, account creation and editing, search, dates, CSV, persisted conversations, backup/restore confirmation, storage-write refusal, escaped input, other-app storage isolation, and mobile layout. Screenshots are written to `/tmp/laura-crm-{desktop,mobile}.png`.

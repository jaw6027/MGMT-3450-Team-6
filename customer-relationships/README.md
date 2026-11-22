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
- **Export filtered CSV** downloads account details for the current view. It excludes conversation history; use the complete JSON backup to retain it. CSV cells are quoted and spreadsheet formula prefixes are escaped. Use **Import marketing leads** to bring in a marketing lead CSV or complete marketing backup; CRM CSV re-import is not supported. Review the count before adding. Imports add independent CRM copies, skip previously imported lead IDs, and do not replace existing accounts or sync changes back to marketing. Different lead IDs for the same company remain separate, so review potential duplicates. Unknown contacts, locations, segments, and purchasing plans stay blank or unclassified; review them after import.
- **Complete backup** downloads all records in the selected demo/personal workspace, independent of filters, with conversation history. Keep personal files private. **Restore backup** validates a CRM JSON file and shows a count before explicit replacement of personal CRM records only. Marketing and product backups are rejected. Cancel leaves saved data unchanged.

Records are stored locally under `laura-ppe-crm-v1`. No account, database, or API keys are required. No background sync, cloud backup, or automatic contact outreach is provided. Marketing imports require an explicit file selection and review. Browser data clearing removes records: download backups regularly. Limits: 1,000 accounts, 200 conversations per account, and 4 MB per backup/save. Invalid or quota-rejected writes leave current records untouched; unreadable saved data is preserved and blocks replacement saves to avoid accidental loss.

Suggested discovery contacts are safety/HSE managers, procurement teams, industrial distributors, and sustainability leads. Segment and role describe different things. Priority is Laura’s judgment, not an invented buyer score. PPE protection/certification and supplier environmental claims need evidence; recording needs, sample feedback, or a customer stage does not certify finished gloves.

## Validation

```sh
npm test
# With npm run dev:crm running:
npm run test:crm:browser
```

Chromium defaults to `/usr/bin/chromium`; override `CHROMIUM_PATH` if needed. Set `CRM_TEST_URL` to test a production or standalone page instead. Browser checks cover demo isolation, account creation and editing, search, dates, CSV, persisted conversations, backup/restore confirmation, storage-write refusal, escaped input, other-app storage isolation, and mobile layout. Screenshots are written to `/tmp/laura-crm-{desktop,mobile}.png`.


**More details** in each account holds phone, location/service area (for example Kern County), the sample/glove version, estimated glove pairs, and purchasing timeline/conditions. These fields survive backup/restore; quantity is an estimate, not an order. Search also matches phone, location, and sample version. **Share progress report** downloads a read-only HTML summary of the filtered workspace without company names, private contact fields, or conversation notes. Demo reports are labeled fictional. Full backups and CSV exports contain private details: keep them private.

Daily follow-ups and account records stay visible. The introduction, relationship-stage chart, and explanatory help open on demand; Complete backup and Restore backup remain directly accessible. Cross-tab checks refuse saves if another tab has changed the stored CRM data; reload to review the latest records.

## Kern County buyer tools

- **Company type** filters operators, drilling contractors, oilfield service companies, distributors, and other buyers independently from the original buyer-segment field. Set the type in the account’s **More details** section. Existing accounts default to Not recorded; imports do not guess a company type or location.
- **Buying requirements** records five discovery topics: glove testing, certifications, sizes, buyer price range, and vendor approval. Each has Not discussed / To confirm / Documented and a details field. Documented means Laura recorded the buyer’s requirement; it does not indicate compliance, certification, or completed testing.
- **Sample follow-up & buyer response** holds the current sample’s sent date, feedback due date, received date, and response. The sample/glove version remains in More details. Enter Sent or Feedback received as appropriate. Feedback dates require a sent date and cannot precede it; actual sent/received dates entered in the form cannot be future dates. Preserve earlier sample versions/responses in Conversation history before updating the current tracker. Marketing imports retain available sample-sent and evaluated dates.
- **Relationships needing attention** lists each matching open account once and gives its reasons: a general follow-up due today/overdue, sample feedback due without a recorded response, or Waiting for reply since at least seven calendar days ago. The reply date is recorded explicitly by Laura; clear it when a reply arrives. Recording received sample feedback clears its feedback reminder. General follow-ups are independent and must be updated separately. Customer and Not a fit accounts retain history but are excluded from this open-relationship list. Upcoming dated general follow-ups remain under an expandable list. All reminders stay on-screen; no messages are sent.

New fields are included in complete backups and private CSV exports. Older CRM backups load with blank dates, Not recorded company type, and Not discussed requirements. The shared aggregate progress report still excludes individual buyer requirements and responses.

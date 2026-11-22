# Laura's product-development website

A separate app for plant-based work glove material research, prototype versions, and test records. It has its own entry point, pages, browser-storage key (`laura-product-development-v1`), and backup format. It does not read, modify, or merge marketing leads, campaigns, or marketing cloud backups.

## Start and build

From the repository root:

```sh
npm ci --cache /tmp/team6-npm-cache
npm run dev:product
npm run build:product:pages
```

Development uses port 5174. The build creates `dist-product/Laura-Product-Development-Dashboard.html`, a single file with JavaScript, styles, and fonts included. The website version is copied to `docs/product-development/index.html`. With GitHub Pages configured to deploy `main` → `/docs`, it has a separate `/product-development/` address under the existing project site. Public deployment must be verified after GitHub publishes it; preparing these files alone does not establish a live website. `npm run build:websites` refreshes both the marketing and product sites without adding product sections to marketing.

## Laura's workflow

1. Explore the clearly labeled fictional demo, then choose **My project** to start or reopen personal records. Viewing the demo later preserves saved personal work. Demo entries are read-only; saving a new material from demo view adds it to the personal project without copying fictional records.
2. **Add material:** record supplier, composition, batch, thickness in mm, quoted cost and cost unit, source classification/reference, and optional energy/carbon figures with their stated measurement basis. Compare up to three materials. Blank values remain unknown. Mixed cost units or environmental bases produce warnings; there is no automatic “best material” or savings calculation.
3. **Add prototype:** give each version a descriptive name, choose its primary material, record its batch and stage, and assign a next action/date. These actions appear in Decisions & next steps. Overdue dates use America/Los_Angeles calendar dates. Retired versions are retained as records but excluded from the active-prototype count and next-action list.
4. **Record test:** select a material or prototype and classify the evidence as Supplier claim, Internal test, Buyer feedback, or Independent lab report. Record the test category, status, date, method/standard version, conditions, tester/lab, sample size, numeric result and unit, qualitative result, criterion, source reference, and notes.
5. Completed entries require date, method, conditions, tester/lab, whole-number sample size, and at least one result. Independent lab entries also require a report/source ID. Recording an assessed outcome requires an explicit criterion and Complete status. Outcomes are Laura's recorded assessments; the app never infers certification or calculates pass/fail from an arbitrary number. Negative numeric test results (for example temperatures) are supported.
6. Attach an optional PDF, PNG, or JPEG report, at most 1 MB each. Files are stored inside the local project and included in full backups. Download them explicitly from the test table. File signatures/types are checked, but this is not a document authenticity, certification, or full PDF-content validator. Use trusted source documents.
7. Search/filter testing records and use **Export testing CSV** to share the selected records, including context and source references. Attachments appear by filename in CSV; binary reports are included only in complete JSON backups.

## Saving and recovery

Saving uses this browser's local storage. The app writes validated data before updating the visible project and reports failures without pretending a record was saved. It detects conflicting changes in another tab and asks for a reload instead of overwriting them.

Use **Download complete backup** regularly. **Restore backup** validates the file and previews its counts before explicit replacement. It replaces only product-development data. Marketing backup files are rejected. Limits are 500 materials, 500 prototypes, 500 tests, 500 expenses, and 4 MB for the complete project; browser quotas can be lower when other sites/apps share the same origin. Restore accepts backup files up to 12 MB to allow a pretty-printed wrapper, but validates the restored project against its 4 MB limit. Photos and report attachments consume space quickly.

**Sign in & share** includes email-code sign-in, opt-in automatic product cloud copies, review/restore of earlier copies, complete file backups, and a read-only progress report. Live cloud features require the [product-specific setup](../cloud/PRODUCT-SETUP.md) and [SQL](../cloud/product-development.sql); they are not active until Laura's project, email delivery, Auth user, and database policies are configured and verified. Product snapshots and browser sign-in settings are separate from marketing. Switching computers, browsers, downloaded-file paths, or website origins can require restoring a product backup. Clearing browser data can remove work that has not been backed up. There is no automatic cross-device merge or background reminder service.

## Guided planning, photos, stock, and costs

- **Start here:** five derived starter steps lead from a personal project to materials, a prototype, a test plan, and a documented complete result. Demo examples are not marked as Laura's completed work. Download backups regularly; checklist completion is not product certification or proof of a cloud upload.
- **Test plan:** due dates are separate from result/evidence dates. Pending tests are labeled overdue, today, upcoming, or unscheduled using Los Angeles calendar dates, with filters for overdue, next seven days, and unscheduled records. Completed tests stay in the register but leave the pending schedule. Older planned-date fields migrate to due dates only when a due-date property was absent; an explicitly cleared date stays unscheduled.
- **Retests:** Plan retest on a completed test creates a new draft linked to the original. It copies context, not the old numeric result, outcome, report, or result date. Describe the design change/retest reason. Links must point to completed tests, cannot link to themselves or form cycles, and cannot have earlier retesting dates. Retesting can target a new prototype/version. Methods, units, conditions, and targets must be reviewed before drawing improvement conclusions; no automatic percent improvement is calculated.
- **Prototype photos:** add PNG/JPEG images in the prototype editor, up to three at 350 KB each. Each has a caption and optional date; captions can be edited and images removed. The photo notebook displays saved copies. Keep original files separately. Photo data is included in complete local/cloud backups, and only included in share reports when explicitly selected.
- **Material inventory:** enter current quantity, unit, location, and reorder threshold in each material. Unknown quantity remains unknown. A known quantity at or below a recorded threshold is flagged for reorder. Units stay per material; totals across mixed units are not calculated. Quantities are updated manually; prototype/test entries do not automatically deduct stock.
- **Development costs:** enter each actual expense once in USD, with date, category, receipt/source reference, optional notes, and an optional link to a material/prototype/test. Each entry has one category and one target, so summaries count it once. Quoted material prices are not automatically expenses. Export costs separately as CSV; complete backups include every entry.
- **Progress report:** share an HTML snapshot or print it to PDF. It includes source context and retesting history. Private supplier/inventory fields, notes, photos, and expenses are excluded by default and require an explicit checkbox. Review custom names and source references before sharing. Full JSON backups remain private recovery files.

## Evidence boundaries

All initial suppliers, material properties, prices, prototypes, and results are simulated. No real material-supplier environmental figures or certification logos are reused. Evidence classifications are entered by Laura, not independently verified. Comparisons preserve units and source context; test results with different methods, conditions, units, or sample sizes are not combined. Material properties and buyer feedback do not establish finished-glove PPE safety or regulatory compliance.

## Validation

```sh
npm test
# With a static server serving the repository, e.g. Python HTTP server on 4190:
PRODUCT_TEST_URL=http://127.0.0.1:4190/docs/product-development/ npm run test:product:browser
```

The browser suites also cover planning, retests, photos, inventory, expenses, report privacy, email-code sign-in, a separate owner-bound cloud collection, automatic backup, failed-upload retry, cloud restore, and sign-out using intercepted service responses. No live sign-in email is sent during tests. Live provider policies, hosting, email delivery, and actual cloud persistence still require verification after setup. Chromium defaults to `/usr/bin/chromium`, configurable via `CHROMIUM_PATH`.

## A calmer everyday view

The home page focuses on next actions and upcoming tests, material comparison, and testing progress. Getting started, project totals, detailed comparisons, test records, and retesting history expand on request. More tools holds prototypes, photos, inventory, and expenses. Save/restore and Sign in & share remain accessible. Help explains saving and evidence. These layout changes preserve existing records and backup compatibility.

## Material combinations and experiments

Use Add material for the original/as-supplied cactus material. Use Add combination for each modified sample, select its baseline, and record what changed, PVC amount/coating with units, backing/layers, preparation/bonding, and its batch ID. The new combination does not copy test results or assume that the original contains no plastic. Blank composition fields mean unknown; enter confirmed absence explicitly.

Select up to three samples and open Material details to compare configurations and all directly linked material tests. Each trial keeps its method, conditions, evidence, date, sample size, result/unit, and criterion. Prototype test results remain in Test records & evidence. Record tests against each exact sample; repeated trials remain separate. No best-material ranking or causal improvement is inferred. Configuration fields are retained in personal storage, full backups, optional cloud snapshots, and progress reports. Existing product backups remain compatible.

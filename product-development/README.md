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

Use **Download complete backup** regularly. **Restore backup** validates the file and previews its material/prototype/test counts before explicit replacement. It replaces only product-development data. Marketing backup files are rejected. Limits are 500 materials, 500 prototypes, 500 tests, and 4 MB for the complete project; browser quotas can be lower when other sites/apps share the same origin. Large report attachments consume that space quickly.

There is no product-app cloud login, automatic cloud backup, or server synchronization in this version. The marketing app's optional Supabase backup does not include this product app. Switching computers, browsers, downloaded-file paths, or website origins can require restoring a product backup. Clearing browser data can remove saved work.

## Evidence boundaries

All initial suppliers, material properties, prices, prototypes, and results are simulated. No real material-supplier environmental figures or certification logos are reused. Evidence classifications are entered by Laura, not independently verified. Comparisons preserve units and source context; test results with different methods, conditions, units, or sample sizes are not combined. Material properties and buyer feedback do not establish finished-glove PPE safety or regulatory compliance.

## Validation

```sh
npm test
# With a static server serving the repository, e.g. Python HTTP server on 4190:
PRODUCT_TEST_URL=http://127.0.0.1:4190/docs/product-development/ npm run test:product:browser
```

The browser suite exercises real record entry, demo/personal isolation, mixed-unit/basis warnings, prototypes, completed-test metadata, criteria, attached report round-trips, filtering, CSV export, full backups/restoration, persistence after reload, marketing-key preservation, mobile width, and failed storage writes. Chromium defaults to `/usr/bin/chromium`, configurable via `CHROMIUM_PATH`.

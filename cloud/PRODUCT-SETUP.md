# Laura's product-development sign-in and automatic backup

Local saving, complete JSON backups, and read-only progress reports work immediately. Email-code sign-in and automatic cloud copies require a one-time Supabase setup. No live project/email delivery has been configured or verified by this coding task.

1. Use a Supabase project owned by Laura. It can be the same project as the marketing dashboard, but product records use a separate table and separate browser sign-in settings.
2. Run [product-development.sql](product-development.sql) once in that project's SQL editor. It creates `product_development_backups`, enables/forces row-level security, and grants authenticated users read/insert access only to their own rows. Anonymous access, updates, and deletes are not granted. Do not turn off RLS or use a service-role key in the browser.
3. Enable the email provider in Supabase Authentication, disable public sign-ups, and create Laura's Auth user with her own email if she does not already have one. Configure/test email delivery. The Magic Link email template must include the numeric code placeholder `{{ .Token }}`. The app requests codes for existing accounts with `create_user: false`.
4. Serve the product site using HTTPS. In **Sign in & share → Connect cloud service**, enter the project's HTTPS URL and its public publishable key (or legacy anon key), then save. Never enter a secret/service-role key or a Supabase account password. `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are optional build-time public settings. Downloaded HTML remains useful locally, but browser policies can restrict remote sign-in from local files; use the HTTPS website for routine sign-in.
5. Laura clicks **Send sign-in code**, enters the emailed code, and clicks **Sign in**. Use **Back up now** and check that a recent copy appears before enabling **Automatically back up saved changes**.
6. Download a complete JSON backup, then test a cloud restore. Review the preview before replacing local work. Confirm that materials, quantities/locations, prototypes, photos, tests, retest links, report files, and expenses are restored.
7. Verify the live table denies anonymous access and denies another authenticated test user access to Laura's rows. Mock automated tests do not prove live policy configuration, email delivery, or cloud persistence.

## What saves where

- Personal product work is saved locally under `laura-product-development-v1`. Existing version-1 backups are migrated without dropping materials, prototypes, or tests. New fields default to unknown/empty, not invented values.
- Product cloud configuration, session, auto-backup preference, and pending marker use the `laura-product-cloud-*` namespace. They do not reuse marketing's `btl-cloud-*` session or pending marker. Only the `product_development_backups` table is used for product copies.
- Cloud snapshots have `app: "laura-product-development"` and include all product records, inventory, photos, files, retest history, and actual expenses. They never include sign-in codes/tokens, API keys, or marketing data.
- Automatic backup is opt-in. It runs after saved changes while the dashboard is open and signed in. Offline/failed writes remain pending and retry on reconnection, on reopening/sign-in, and periodically while the page stays open. Closing the browser before upload finishes means that change is not yet protected in the cloud. A closed browser cannot upload.
- Cloud snapshots are immutable; old copies are not overwritten by a new save or restore. The UI lists the newest 20 copies. Project-owner retention and provider disaster-recovery settings are separate responsibilities. Cross-device editing is not automatically merged.
- Sign-in protects private cloud copies, not records already available in a local browser profile or an HTML file. Sign-out leaves local product work in place. A sign-in screen is not an encryption/password lock on the downloaded application.
- Keep complete JSON backups as a second recovery route. New complete backups wrap the entire validated product project, including photos, files, and expenses. The app can restore both that format and its older raw version-1 product backups. Marketing backups are rejected.

## Sharing

**Sign in & share → Download report** exports a standalone, read-only HTML progress snapshot. Open it in a browser and Print → Save as PDF if preferred. The default report includes material/prototype/test names, methods, conditions, source references, criteria, retest changes, results, and next steps. Supplier fields, inventory details, photos, private notes, and expense details are excluded unless Laura selects the explicit checkbox. Review names and references before sharing, because custom fields may contain identifying information. Detailed reports include selected photos; test-report binary files remain in private backups and can be sent separately if appropriate.

Reports contain no app editing controls, cloud credentials, login session, or connection to her live project. They do not update automatically, and sharing one does not grant access to her cloud backups. Complete JSON backups are private recovery files, not public progress reports. Nothing is emailed, published, or sent to others automatically.

## Limits and troubleshooting

- The local project is limited to 4 MB and 500 records of each type (materials, prototypes, tests, and expenses). A report attachment can be PDF/PNG/JPEG up to 1 MB; each prototype can have three PNG/JPEG photos up to 350 KB each. Keep original full-resolution files separately. Storage quotas may be lower when the browser stores other apps on the same origin. Failed writes do not replace saved state.
- A 404 table error means the URL/schema setup needs checking. For this site, run `cloud/product-development.sql`, not the marketing-only table script.
- An invalid/expired code requires a fresh sign-in. Check Auth user setup, the token template, SMTP/email configuration, and provider limits if no code arrives.
- An access-denied error requires checking the authenticated account and table policies. Never replace owner-only rules with public access.
- A pending marker is not proof of a saved cloud copy. Keep the page open, reconnect, and verify a successful status and history entry.
- Follow the same hosting and credential guidance in [SETUP.md](SETUP.md), using the product table/script and product site's sign-in button.

# Laura's private cloud sign-in and backups

Sharing reports and downloading/restoring complete JSON backups work without an account. Live email sign-in and automatic cloud backup require the following one-time setup in a Supabase project owned by Laura. This repository does not contain a live project or working cloud credentials.

## One-time setup

1. Create a project in [Supabase](https://supabase.com/dashboard). Keep ownership and billing under Laura's control.
2. In the project's SQL editor, run the complete contents of [supabase.sql](supabase.sql) once. It creates `dashboard_backups` with owner-only row-level security. Authenticated users can insert and read only their own immutable snapshots. Anonymous reads/writes, updates, and deletes are not granted.
3. In Authentication settings, enable the email provider and disable public user sign-ups. Create Laura's user in Authentication → Users using her own email address. The app's sign-in request uses `create_user: false`; it does not register strangers.
4. In the email **Magic Link** template, include the code variable `{{ .Token }}` in the body, for example: `Your dashboard sign-in code is {{ .Token }}`. The app accepts the emailed numeric code, not a redirect link. Configure and test email delivery using Supabase's supported SMTP/email configuration. Sender restrictions, quotas, expiry, and code length are controlled by that project.
5. Copy the HTTPS project URL and its **publishable key** (or legacy **anon** key) from the project's connection/API settings. Never use a secret key or `service_role` key in the dashboard. Public keys identify the project; row-level security and Laura's authenticated user token protect the records.
6. Serve the built `dist/` directory through an HTTPS static website host. No custom application server is needed. In the dashboard, open **Share & backup → Connect cloud service**, enter the project URL/public key, and save. Alternatively, configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` before building. Only public configuration belongs in `VITE_*` values. The standalone downloaded copy remains available; its ability to connect to Supabase depends on browser restrictions for local HTML files. Use the HTTPS-hosted version for routine sign-in.
7. Laura clicks **Send sign-in code**, enters the code from her email, then clicks **Sign in**. Choose **Back up now** to verify the first copy appears under Recent private copies. Only then enable **Automatically back up saved changes**.
8. Test restoring a saved copy and confirm the leads, goals, campaign costs, notes, and sample milestones match. Keep a complete JSON backup before trying a restore. Verify anonymous database access is denied; if there is another test account, confirm it cannot read or insert a row belonging to Laura. Do not enable public access or turn off RLS to fix a failed check.

No account has been created, no sign-in email has been sent, and no site has been deployed by the code-writing task. The code's automated cloud tests use intercepted/mock service responses. Successful mock tests do not establish live email delivery, live database policies, hosting availability, or actual cloud persistence.

## How backups work

- Automatic backup is opt-in and requires an authenticated account, personal data, a running dashboard tab, an Internet connection, and working project policies. Demo records are excluded.
- Each successful saved change schedules a complete snapshot after a short debounce. Backups contain **all** personal leads, follow-up status, sample dates, buyer notes, goals, and campaign totals—not just the currently filtered rows. Snapshots do not include sign-in codes, tokens, public connection configuration, or API keys.
- Old cloud copies are retained. Uploads do not overwrite earlier copies; the UI lists the newest 20. Long-term retention and project usage should be managed by the project owner in Supabase. This is an application snapshot system, not a replacement for the provider's independent database disaster-recovery policy.
- Offline/failed uploads retain a small pending marker, bound to the project and verified user ID. The underlying data remains saved locally. The latest local copy is retried when connectivity returns, on sign-in/reopen, and periodically while the page is open and automatic backup remains enabled. Closing the page before an upload finishes means that change is not yet protected in the cloud. A closed browser cannot perform uploads.
- Tokens are kept in the current tab's session storage, with refresh before expiry. Sign-in is reverified with Supabase after reload. Session-storage restrictions can require signing in again. Sign out revokes the session when possible and clears the app's current sign-in, without deleting local work or old cloud snapshots.
- This is **backup and explicit restore**, not automatic merging across devices. Signing in does not silently replace local records. Restoring presents a preview and requires **Replace local work**. The complete local lead list and planner are stored together in one local-storage write, avoiding a partial restore of leads without their goals/costs. Existing separate planner settings are read for migration.
- A login protects private cloud copies; it is not a lock or encryption layer for records already saved in a local browser profile or a downloaded HTML file. Keep the computer/browser profile private. Report recipients do not receive Laura's login, editable dashboard state, or cloud access.

## Sharing and recovery without cloud setup

- **Download report** creates a read-only HTML snapshot of the selected dashboard cohort. It excludes individual companies, lead IDs, owners, follow-up dates, and free-text buyer notes. Custom audience, channel, and message labels are included. Goals and campaign names/costs are excluded unless Laura selects the explicit checkbox. Review the report before attaching it to an email. Open it in a browser and Print → Save as PDF if a PDF is preferred. There is no automatic publishing or generated public sharing URL.
- **Download complete backup** creates a private JSON file of all work, including goals and costs. It is appropriate for recovery, not public sharing. The file can be placed in Laura's own cloud drive manually. Downloading a backup does not prove that a cloud drive has uploaded it.
- **Choose a complete backup to restore** validates that file, previews the contents, and offers explicit replacement. Invalid files and failed storage writes leave the current workspace unchanged.

## Troubleshooting

- No email/code: confirm Laura exists as an Auth user, email sign-in is enabled, the template contains `{{ .Token }}`, and the project's email delivery settings allow the recipient. Retry only after a meaningful correction or the provider's rate-limit interval.
- 401/invalid code: request a fresh code and sign in again. Local data is unaffected.
- 403/access denied: check the signed-in account and RLS/grants from `supabase.sql`; never use a service-role key in the browser as a workaround.
- Missing table/404: check the project URL and that the SQL was run in the same project.
- Pending: reconnect, keep the dashboard open, and inspect the status. The app reports cloud success only after a successful service response. A pending marker alone is not a backup.
- Different pending account: sign in to the original account to upload, or explicitly discard only the pending upload marker after making a complete file backup. The app does not send an old account's pending copy to another account automatically.

## Validation

Run `npm test`, `npm run build:standalone`, and the browser suites against the production preview. `tests/sharing-browser.js` covers report exclusions, complete-file restore, OTP flow, owner-bound uploads, opt-in autosave, failed upload retry, cloud restore preview/confirmation, sign-out, and mobile layout using mock cloud requests. Live provider verification remains required after configuration.

# Laura’s customer-facing venture website

A separate public-facing introduction to Beyond Traditional Leather for Kern County oilfield operators, drilling contractors, service companies, and PPE distributors. It does not expose the private marketing, product-development, or CRM workspaces or any customer records.

The concise page covers the concept, development approach, FAQs, and buyer inquiry. The glove is original SVG concept artwork, explicitly labeled as an illustration rather than a photo or tested product. No certification logos, quantified sustainability claims, prices, testimonials, or unverified performance claims are used. Material modifications including PVC/backings are described accurately; plant-based does not imply plastic-free or biodegradable.

## Buyer tool and contact flow

A short buyer-needs questionnaire asks for name, company, email, and conversation topic, with optional role, timeline, tasks, sizes, required testing, and questions. Submit prepares a local draft for review. The visitor must then choose Open in my email app and send through their own email application; Copy message offers a fallback. The website does not send email, store questionnaire data, add CRM records, run analytics, or guarantee sample availability. There is no hazard assessment or automatic PPE selection. Laura can manually record received inquiries in her CRM.

The contact email is `carrillojerez5043@yahoo.com`, drawn from the venture contact in the provided portfolio screenshot. Review it if Laura changes her public business contact. No real email was sent during testing.

## Build and preview

From the repository root:

```sh
npm run dev:venture
npm run build:venture:pages
npm test
# With the development server running:
npm run test:venture:browser
```

Development uses port 5176. Build creates a standalone `dist-venture/Laura-Customer-Website.html` and copies it to `docs/venture/index.html` for the existing GitHub Pages deployment. All styles, fonts, scripts, and artwork are embedded in the standalone file. No external service is required to render the page.

The expected Pages address after successful deployment is `https://jaw6027.github.io/MGMT-3450-Team-6/venture/`. This environment blocks requests to the GitHub Pages host, so live public availability has not been verified; a local preview or committed Pages file is not evidence of a successful deployment.

Buyer questionnaire tests cover validation, encoded mailto fields, no automatic sending/storage, clipboard fallback, responsive navigation, accessible FAQ controls, and escaped input. Override `VENTURE_TEST_URL` or `CHROMIUM_PATH` for browser checks if needed.

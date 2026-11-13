# Astra Intelligence — website & Interactive Solutions Lab

Corporate website for **Astra Intelligence** (*Technology Beyond Boundaries.*) with an
**Interactive Solutions Lab**: nine working product demonstrations that run entirely in the
browser on realistic sample data.

Built with React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Recharts and Lucide icons.
No animation library: motion is CSS (transform/opacity) driven by IntersectionObserver.

---

## Quick start

Requires **Node.js 20.19+ or 22.12+**.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script              | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Development server with hot reload                      |
| `npm run build`     | Type-check (`tsc -b`), production build into `dist/`, then pre-render the first-paint shell (`scripts/prerender-shell.mjs`) |
| `npm run preview`   | Serve the production build locally                      |
| `npm run typecheck` | Type-check only                                         |
| `npm run lint`      | Lint with oxlint (React, hooks, TypeScript, a11y rules) |

No environment variables are needed to run the site. Without them every integration falls
back to a clearly labelled demo behavior (see [Configuring integrations](#configuring-integrations)).

---

## What's in the site

| Route               | Page                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `/`                 | Home: hero, solutions explorer, Lab preview, industries, approach, tech stack, about, contact |
| `/solutions`        | All nine solution areas                                                                     |
| `/solutions/:slug`  | Solution page: what it is, why it matters, features, embedded live demo, applications, deliverables, CTA |
| `/lab`              | Interactive Solutions Lab: launch any demo, reset all demo data                             |
| `/lab/:slug`        | Full-screen demo                                                                             |
| `/industries`       | Industries and the solutions most relevant to each                                          |
| `/about`            | Company, mission, vision, values, development approach                                      |
| `/contact`          | Enquiry form (`?service=<slug>` pre-selects a service, `?intent=consultation` marks a consultation request) |

## The nine demos

Every demo has its own navigation and controls, pre-populated data, a visible **Demo
environment** badge (click it for what is real vs. simulated), a **Reset Demo** button, a
**theme picker** (three product templates, each in light and dark), and saves its state in
`localStorage` so changes survive a page reload.

| Slug                      | Demo               | Highlights                                                                                                                                          |
| ------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `saas-development`        | Astra Console      | Multi-tenant organizations, users & role permissions, subscription plans, usage analytics, API keys, integration health checks                       |
| `ecommerce-inventory`     | Astra Commerce     | Storefront with cart & checkout, order lifecycle, products, stock movements, low-stock alerts & restocking, customers                                  |
| `business-dashboards`     | Astra Insights     | KPI dashboards with filters, drill-downs, customer & geography views, profit & loss, CSV reports                                                     |
| `ai-chatbots`             | Astra Assist       | Intent detection, entity extraction, sentiment, order lookup, returns/cancellations, lead qualification & scoring, human hand-off, knowledge base    |
| `predictive-analytics`    | Astra Foresight    | In-browser forecasting (Holt-Winters, Fourier regression, seasonal naïve) with backtests (MAPE/MAE/RMSE), prediction intervals, scenarios, anomalies |
| `collaborative-workspace` | Astra Workspace    | Kanban with drag & drop, list view, projects, team workload, deadlines & activity, shared documents                                                 |
| `fintech-automation`      | Astra Ledger       | Transactions in ₹ (INR), explainable auto-categorization that learns from corrections, budgets & alerts, monthly reports, savings goals            |
| `erp-automation`          | Astra ERP          | Employees, attendance, simulated payroll with payslips, departments, purchase orders with approval & delivery tracking, vendors                     |
| `document-intelligence`   | Astra DocIQ        | Receipt/invoice extraction pipeline, confidence scores, review & correction, GST/GSTIN/total validation, duplicate check, CSV/JSON export, history  |

### What is real and what is simulated

The demos are honest about what they do:

- **Computed for real, in your browser:** all calculations, filters, charts, validation rules,
  forecasts and backtests, anomaly detection, inventory and order logic, payroll arithmetic,
  lead scoring, CSV/JSON exports.
- **Simulated:** sample data is generated; no real payments, payroll transfers, emails,
  messages or third-party integrations ever happen. Integration "health checks" are simulated.
  Payroll runs never initiate payments.
- **AI chatbot:** without `VITE_CHAT_API_URL`, replies come from a transparent rule-based
  engine (intent scoring, entity extraction, sentiment), and the UI says so.
- **Predictive analytics:** forecasts are produced by classical statistical models run on the
  sample history, never random numbers. Charts separate historical data from forecasts.
- **OCR:** without `VITE_OCR_API_URL`, the sample documents use predefined extraction results
  (labelled "Simulated OCR"); uploaded files are not read and go straight to manual entry.

Demo data lives under `astra:demo:<demo-id>:v<version>` in `localStorage`. **Reset Demo**
restores one demo; the Lab page can reset all of them.

---

## Design system & themes

All colour is expressed as CSS custom properties (`src/index.css`). Tailwind utilities such as
`bg-panel`, `text-fg-2`, `border-line` or `bg-brand/15` resolve to those variables, so anything
built from them re-themes automatically.

| Layer | Where | What it sets |
| --- | --- | --- |
| Corporate dark (default) | `:root` in `src/index.css` | Deep navy surfaces, electric blue / violet accents |
| Corporate light | `[data-theme='light']` in `src/index.css` | Light surfaces, deeper accents, light-mode remaps of status colours |
| Product theme | demo root (inline variables) | The demo's own palette for the current mode: surfaces, text, brand, chart series, radius |

Token families: surfaces (`canvas`, `base`, `chrome`, `panel`, `raised`, `popover`, `hover`,
`sunken`, `line`, `line-strong`, `scrim`), ink (`fg`…`fg-4`; `ink` for subtle overlays, so use
`bg-ink/[0.04]` rather than `bg-white/[0.04]`; `on-brand` for text on brand fills), brand
(`brand`, `brand-strong`, `brand-hover`, `brand-soft`, `accent`, `accent-soft`), chart
(`series-1…8`, `deemph`) and status (`good`, `warning`, `serious`, `critical`).

**Light / dark mode.** The sun/moon switch (in the navigation and in every demo) sets
`<html data-theme>` and persists the choice under `astra:theme`. An inline script in `index.html`
applies it before the first paint, so there is no flash of the wrong theme. Open tabs stay in sync.

**Product themes.** Each demo has three templates defined as data in `src/theme/demo-presets.ts`
(primary, secondary, neutral surface tint, chrome style, corner radius).
`src/theme/demo-theme-engine.ts` derives complete light and dark palettes from a preset in OKLCH
and enforces WCAG AA text contrast (button text turns dark on light primaries such as amber or
mint). The visitor's choice is stored per demo under `astra:theme:demo:<id>`.

| # | Product | Default template | Other templates |
| --- | --- | --- | --- |
| 01 | Astra Console (SaaS) | Midnight Indigo: `#6366F1` / `#818CF8` on deep navy | Graphite, Electric (contrast sidebar) |
| 02 | Astra Commerce | Emerald: `#10B981` / `#34D399` on charcoal / white | Fresh Mint, Boutique |
| 03 | Astra Insights (BI) | Royal Insight: `#2563EB` / `#06B6D4` on navy slate | Arctic Slate, Executive |
| 04 | Astra Assist (AI) | Violet Pulse: `#8B5CF6` / `#C084FC` on deep purple | Orchid, Midnight Neon |
| 05 | Astra Foresight | Deep Teal: `#0D9488` / `#2DD4BF` on dark teal | Lagoon, Signal |
| 06 | Astra Workspace | Amber Studio: `#F59E0B` / `#FBBF24` on warm charcoal | Terracotta, Honey & Ink |
| 07 | Astra Ledger (FinTech) | Blue Mint: `#0EA5E9` / `#34D399` on dark navy / white | Sapphire & Gold, Glacier |
| 08 | Astra ERP | Steel Blue: `#0284C7` / `#22D3EE` on slate navy | Carbon, Industrial |
| 09 | Astra DocIQ (OCR) | Rose: `#F43F5E` / `#FB7185` on charcoal / white | Coral Paper, Ruby Slate |

**Charts** read their colours with `useChartTheme()` (`src/demos/shared/demo-theme.ts`): series,
grid, axes, tooltips and a sequential ramp all follow the product theme. Never hard-code chart
colours; use `SERIES[n]` in order. Inline styles may use the CSS variables directly
(`var(--color-series-1)`, `var(--color-good)`).

To add a template, append a preset to the product's list in `src/theme/demo-presets.ts`. To give a
marketing component a product colour, set `style={accentVars(solution)}` and use the `text-sol` /
`text-sol-accent` utilities (they pick the right shade for light or dark mode).

---

## Performance architecture

| Concern | How it is handled |
| --- | --- |
| First paint | `scripts/prerender-shell.mjs` renders the real navigation and hero (plus route skeletons, including each demo's page header) into `dist/index.html`, with the CSS inlined. The page is meaningful before any JavaScript runs; React replaces the shell in its first commit with identical markup. |
| Theme and device before paint | The inline bootstrap script in `index.html` sets the theme, marks low-power devices (`html.lite`) and selects the shell variant for the URL. |
| Code splitting | Every page and demo is lazy. The homepage below the hero is its own chunk (`HomeSections`). Recharts ships in one shared `charts` chunk, loaded only by demos that draw charts. Chunk groups are configured in `vite.config.ts`. |
| Preloading | The bootstrap starts the current route's chunks in parallel with the main bundle (map generated from Vite's manifest at build time). Links prefetch their route on hover or focus (skipped on Save-Data and 2G). Demos embedded on solution pages mount when scrolled near. |
| Rendering | Below-the-fold homepage sections use `content-visibility: auto`. Charts render in a deferred, interruptible pass; demo view and template switches run as transitions; searches use `useDeferredValue`; demo state writes to `localStorage` are coalesced. |
| Motion | CSS transforms and opacity only. Decorative loops pause off-screen and in background tabs, and are disabled for `prefers-reduced-motion` and on low-power devices. |
| Low-power mode | `html.lite` (≤ 4 GB RAM, ≤ 4 CPU cores, Save-Data, 2G/3G, or reduced motion) removes backdrop blur, decorative animation and chart entry animations. Override with `?perf=lite` or `?perf=full` (remembered). |
| Assets | One self-hosted font family (Geist, Latin subsets, `font-display: swap`, preloaded), system monospace, a 6 KB logo, no large images. |
| Errors | App- and route-level error boundaries; a failed chunk download shows a reload prompt instead of a blank screen. |

---

## Configuring integrations

Copy `.env.example` to `.env.local` and set what you need. Vite inlines `VITE_*` values into
the public JavaScript bundle at build time, so **never put secret keys in these variables**.
Point them at your own backend, which holds provider keys.

| Variable                | Used by                     | When empty                                                                 |
| ----------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `VITE_CONTACT_ENDPOINT` | Contact form                | Enquiry is kept in the visitor's browser; the form says nothing was sent and offers a pre-filled email |
| `VITE_BOOKING_URL`      | "Book a Consultation" CTAs  | Opens the contact form with "consultation" pre-selected                    |
| `VITE_CHAT_API_URL`     | AI chatbot demo             | Built-in rule-based engine                                                 |
| `VITE_OCR_API_URL`      | OCR demo (uploads)          | Sample documents use predefined results; uploads go to manual entry        |

Restart `npm run dev` (or rebuild) after changing these values.

### Contact form: `VITE_CONTACT_ENDPOINT`

`src/services/contactService.ts` sends a `POST` with a JSON body:

```json
{
  "fullName": "…", "company": "…", "email": "…", "phone": "…",
  "service": "ai-chatbots", "serviceLabel": "AI Chatbots & Customer Agents",
  "budget": "…", "description": "…", "consultation": false,
  "submittedAt": "2026-01-01T10:00:00.000Z", "sourcePage": "/contact", "reference": "ENQ-…"
}
```

Any `2xx` response counts as delivered; anything else shows an error with an email fallback,
so an enquiry is never silently lost. Your own API, an automation webhook (n8n, Make, Zapier)
or a form service all work. Allow the site's origin in the endpoint's CORS settings.

### AI chatbot: `VITE_CHAT_API_URL`

The chat UI talks to a `ChatProvider` (`src/services/ai/types.ts`). When the variable is set,
`httpChatProvider.ts` sends:

```json
{ "message": "Where is my order ORD-10482?", "context": { /* ConversationContext */ }, "history": [{ "role": "customer", "text": "…" }] }
```

and expects a `BotReply`-shaped response. Required: `messages` (array of `{ "text": "…" }`),
`context` (send back the updated context) and `sentiment` (`{ "score": 0.2, "label": "neutral" }`).
Optional: `intents`, `entities`, `category`, `escalation`, `suggestions`, `resolved`.

Typical backend: an LLM with retrieval over your knowledge base and tool calls for order lookups.
Keep the LLM provider's API key on the server.

### OCR / document intelligence: `VITE_OCR_API_URL`

`src/services/ocrService.ts` uploads the file as `multipart/form-data` (field `file`) and
expects an `Extraction` JSON document (`src/types/ocr.ts`):

```json
{
  "documentType": "Tax invoice", "typeConfidence": 0.97, "currency": "INR",
  "fields": [{ "key": "total", "label": "Total amount", "value": "40474.00", "confidence": 0.98 }],
  "lineItems": [{ "id": "1", "description": "…", "qty": 1, "unitPrice": 24000, "amount": 24000, "confidence": 0.95 }],
  "rawText": [{ "text": "TOTAL ₹40,474.00", "confidence": 0.98 }],
  "engine": "Your engine name"
}
```

Field keys: `merchant`, `invoiceNumber`, `date` (YYYY-MM-DD), `dueDate`, `customer`, `gstin`,
`subtotal`, `tax`, `total`, `paymentMethod`. The backend can wrap any engine: Tesseract, AWS
Textract, Google Document AI, Azure Document Intelligence or a vision-capable LLM. Validation,
review and export work unchanged.

### Other extension points

- **Expense categorization** (`src/services/ai/expenseClassifier.ts`): implement the
  `ExpenseClassifier` interface against a model endpoint to replace the keyword classifier.
- **Demo data → real APIs:** each demo keeps domain logic in pure functions (`src/demos/<demo>/logic.ts`)
  over typed state (`src/types/`), seeded from `src/data/mock/`. To connect a real backend,
  replace the mock seed and the `usePersistentState` call with API reads and send each logic
  operation to the matching endpoint.

---

## Before launch

- [ ] Replace the placeholder email and social profile URLs in `src/data/constants/site.ts`.
      They are **not** real accounts yet.
- [ ] Set `VITE_CONTACT_ENDPOINT`. Until then, enquiries stay in the visitor's browser and
      the form asks them to email instead.
- [ ] Set `VITE_BOOKING_URL` if you use a scheduling tool.
- [ ] Review the About and approach copy (`src/data/constants/company.ts`, `approach.ts`).
- [ ] Optional: add an Open Graph image (`og:image` in `index.html`), analytics, and a privacy policy page.

## Deployment

`npm run build` produces a static site in `dist/` that any static host can serve. Because it
is a single-page app, unknown paths must fall back to `index.html`:

- **Vercel:** `vercel.json` (included).
- **Netlify / Cloudflare Pages:** `public/_redirects` (included, copied into `dist/`).
- **Nginx:** `location / { try_files $uri /index.html; }`

## Project structure

```
src/
  components/   ui/ (design-system primitives) · layout/ · navigation/ · sections/ · common/
  data/         constants/ (site, solutions, industries, approach, tech stack, company copy) · mock/ (demo seed data)
  demos/        one folder per demo + shared/ (DemoShell, theme provider, chart theme) · loaders.ts / registry.ts (lazy loading)
  hooks/        usePersistentState, useMediaQuery, useToday, …
  pages/        route components
  routes/       router, path helpers, route chunk map and prefetching
  theme/        colour maths, light/dark mode, demo theme presets and palette engine
  entry-shell.tsx  build-time render of the first-paint shell (not shipped to browsers)
  services/     contact, chat (AI) providers, expense classifier, OCR, storage
  types/        domain types per demo
  utils/        formatting (₹ INR, dates), export (CSV/JSON), ids, seeded random
```

Each demo is code-split and loads only when opened. Motion respects the visitor's
**reduce motion** setting. See [Performance architecture](#performance-architecture).

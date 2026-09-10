# Planex AI — Plan & Execute

An AI-assisted interior design product for **homeowners (B2C)**. Planex AI walks a customer through the full journey — from an idea conversation to a signed-off, executed project — with a guided design docket, vendor quotations, and execution tracking.

> **Live, zero-dependency app.** Pure HTML/CSS/JS. No build step, no package manager. Open it or host it anywhere.

---

## The B2C Journey

```
  ① Ideate            ② Design Docket       ③ Quotation           ④ Execution
  Planex AI chat  →   Floorplan + BOQ   →   Compare vendors   →   Track + QC
  upload images       furniture layout      specs stay locked      milestones
  & site plans        editable quantities   line-by-line          handover
```

| Stage | Module | What the customer does |
|---|---|---|
| **1. Ideate** | **Planex AI** | Chats with an interior-design assistant, uploads room photos and site plans, builds an evolving project brief. |
| **2. Plan** | **Design Docket** | Reviews a scaled floorplan with furniture footprints and an editable, itemised Bill of Quantities. |
| **3. Buy** | **Quotation** | Gets matched to verified vendors, compares quotes line-by-line, and selects one. Component specifications are locked so nothing gets swapped silently. |
| **4. Execute** | **Execution Dockets** | Tracks the project phase timeline, signs off milestones, logs QC/snag items, and runs the handover checklist. |

---

## Project Structure

```
index.html                 App shell (sidebar, topbar, bottom nav, modals)
serve.ps1                  Local static server (PowerShell, no dependencies)

css/
  design-system.css        Design tokens, typography, primitives
  app.css                  Layout + module styles

js/
  data.js                  Seed project (rooms, BOQ, vendors, timeline, QC)
  store.js                 Reactive state, localStorage, financial calculators
  ai-engine.js             Domain-aware interior assistant responses
  app.js                   Icons, UI helpers (toast/modal/lightbox), router
  modules/
    dashboard.js           Lifecycle overview + stage rail + stats
    planex-ai.js           Chat + image / site-plan uploads
    design-docket.js       Floorplan canvas + furniture layout + BOQ
    quotation.js           Vendor quotes, comparison, spec-lock, PDF export
    execution.js           Timeline, milestones, QC, handover

assets/                    (reserved for static assets)
```

Module folders are named after the actual product stages so the codebase maps 1:1 to the customer journey.

---

## Run Locally

Requires **PowerShell** (already on Windows). No Node, no npm.

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8080
```

Then open **http://localhost:8080/**.

You can also just double-click `index.html` — everything works from `file://` too.

---

## Deploy (Go Live)

Because it's a static site, deploy in seconds on any of these:

| Host | How |
|---|---|
| **Netlify** | Drag the folder onto app.netlify.com, or connect the repo. |
| **Vercel** | `vercel` in the repo root, framework preset **Other**. |
| **GitHub Pages** | Push to `main`, enable Pages → serve from root. |
| **Cloudflare Pages** | Connect repo, build command empty, output `/`. |
| **Any web host** | Upload `index.html`, `css/`, `js/` via FTP. |

No environment variables are required for the current experience.

---

## Features

**Planex AI (Ideate)**
- Conversational interior assistant with intent handling for cost, kitchens, living rooms, bedrooms, storage, lighting, flooring, styles, timelines, and vendors.
- Image and **site-plan upload** with live preview and lightbox.
- Uploads update the evolving project brief (`store.context`), which flows into later stages.
- Suggested prompts and a project-brief viewer.

**Design Docket (Plan)**
- Scaled 2D floorplan canvas (≈1:50) per room with a metric grid and dimension labels.
- Automatic **furniture footprints** with clearances, tailored per room type.
- Toggle grid and furniture layers.
- Editable BOQ (quantity and rate), live subtotal, 18% GST, and budget variance.
- Add custom BOQ items; print / save as PDF.

**Quotation (Buy)**
- Three matched vendors with ratings, lead time, warranty, and payment terms.
- Quotes derived from the *same* BOQ — only rates differ, so **specifications stay locked**.
- Line-by-line comparison table highlighting the lowest cost per item.
- Select a vendor, then export a print-ready quotation PDF.

**Execution Dockets (Execute)**
- 7-phase timeline with per-phase progress and milestone checklists.
- Overall progress, phases complete, open-QC and current-phase KPIs.
- Quality-check / snag list with severity, trade, and resolution.
- Daily site docket (work log) with AI flags.
- Handover checklist.

**Throughout**
- Light / dark theme.
- Multi-currency (INR, USD, EUR, AED) with live conversion.
- Responsive: sidebar on desktop, bottom navigation on mobile.
- State persists to `localStorage`; one-click reset to the demo project.

---

## Roadmap (Production Backend)

The current app is fully functional client-side with a local assistant. To take it to production:

1. **Planex AI via OpenRouter** — swap `js/ai-engine.js`'s `respond()` for a server call to OpenRouter (Claude / GPT / Gemini), passing the project context as the system prompt.
2. **Persistent project store** — move `store.js` state to Postgres behind an API.
3. **WhatsApp-first onboarding** — Meta WhatsApp Cloud API webhook so customers can start in chat; the web app becomes the deep-work surface.
4. **Site-plan vision** — send uploaded plans to a vision model to auto-extract rooms and dimensions.
5. **Vendor network** — real quotations, PDF generation server-side, and acceptance tracking.
6. **Auth** — account and project access for homeowners.

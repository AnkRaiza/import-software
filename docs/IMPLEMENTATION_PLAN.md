# Import Cost Management System — Implementation Plan

**Version:** 1.0 · **Date:** 2026-07-16 · **Status:** Approved (MVP scope)

Source requirements: [PRD.md](PRD.md)

---

## 1. Strategy

Ship a **static React MVP first**, then add a PHP + MySQL backend in phase 2
once shared/multi-user data is actually needed. The MVP is not throwaway: the
landed-cost engine lives in TypeScript regardless of backend, and all data
access sits behind a repository interface so the storage layer can be swapped
from IndexedDB to an HTTP/PHP API with **no changes to UI or calc code**.

Deployment reuses the existing GitHub Actions → HostGator FTP pipeline; we add
a Vite build step and deploy the build output to `public_html`.

---

## 2. MVP scope

**In:** all 10 modules (Dashboard, Product Catalog, Suppliers, Purchase Order,
Logistics, Customs/SUNAT, Cost Allocation, Pricing, Import History, Scenario
Simulator); full landed-cost calculation engine; local persistence
(IndexedDB); Excel/JSON export & import; dark/light themes; responsive layout.

**Deferred to phase 2 (backend):** multi-user auth, shared/cloud data,
server-side audit log, SUNAT/ERP/accounting integrations.

---

## 3. Tech stack (MVP)

| Concern            | Choice                              | Rationale                                   |
| ------------------ | ----------------------------------- | ------------------------------------------- |
| Build              | Vite + React + TypeScript           | Static output, ideal for HostGator          |
| Styling            | TailwindCSS                         | PRD requirement                             |
| Charts             | Recharts                            | PRD requirement                             |
| Routing            | React Router                        | SPA navigation                              |
| Persistence        | Dexie (IndexedDB) behind repo iface | Swappable for HTTP/PHP later                |
| Money math         | decimal.js                          | Never use float for currency                |
| Forms / validation | react-hook-form + zod               | Rigor around editable vs calculated fields  |
| Excel I/O          | SheetJS (xlsx)                      | Export/import + backup                       |

No authentication and no external services in the MVP (single local user).

---

## 4. Repository structure

```
import-software/
├── frontend/               # React + Vite + TS app
│   └── src/
│       ├── lib/
│       │   ├── calc/       # landed-cost engine (pure functions)
│       │   ├── db/         # Dexie schema + entity types
│       │   └── repo/       # repository interface + IndexedDB impl
│       ├── modules/        # one folder per PRD module
│       ├── components/     # shared UI (layout, cards, tables, theme)
│       └── ...
├── public/                 # CI writes the built SPA here for FTP deploy
├── docs/                   # PRD + this plan
└── .github/workflows/      # build frontend → FTP to HostGator
```

---

## 5. Data model

Entities (from PRD): `users`, `suppliers`, `products`, `purchaseOrders`,
`purchaseOrderItems`, `logisticsCosts`, `taxProfiles`, `imports`,
`costAllocations`, `pricingProfiles`.

Design rules:
- An **`import`** is the top-level aggregate joining a PO + logistics + tax
  profile + resulting allocations. This is the record the History module
  compares.
- All monetary/measurement values stored at full precision; round only for
  display.
- **FOB is never an input** — it is derived from PO line items and stored as a
  computed snapshot on save (PRD: "FOB MUST NEVER be manually entered").

---

## 6. Calculation engine

Implemented once, in TypeScript (`src/lib/calc/`), as pure functions so the
Scenario Simulator can recompute instantly with no round-trips. Storage keeps
inputs + a computed snapshot; it does not re-implement the math.

Flow: `FOB (from PO) → + logistics → CIF basis → SUNAT taxes (Ad Valorem, IGV,
IPM, Perception) → allocate logistics + taxes across products by chosen method
(quantity / weight / area / FOB value) → landed cost per unit & per m² →
pricing at margin tiers`.

---

## 7. Deployment pipeline

1. Build frontend — `npm ci && npm run build` (Vite → static).
2. Stage build output into `public/`.
3. FTP upload `public/` → HostGator `public_html` (existing secrets).
4. SPA routing handled by `.htaccess` (catch-all → `index.html`).

---

## 8. Local development

Windows 11: run the Vite dev server (`npm run dev`, http://localhost:5173).
No PHP/MySQL needed for the MVP. Phase 2 will add Laragon/XAMPP instructions.

---

## 9. Phase 2 (future — backend)

Slim 4 (PHP) REST API + Eloquent + Phinx migrations + MySQL on HostGator,
JWT auth, served from `public_html/api`. The repository interface's HTTP
implementation replaces the IndexedDB one; UI and calc code stay unchanged.

---

## 10. Success criteria (MVP)

Replaces the Excel workflow for landed-cost calculation with accurate results,
a reusable product catalog, local import history and comparison, executive
dashboard, and a clean upgrade path to a shared backend.

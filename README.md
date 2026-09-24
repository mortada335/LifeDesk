# LifeDesk — Personal Obligations & Life Management Hub

[![Monorepo](https://img.shields.io/badge/Turborepo-v2.10-blue.svg)](https://turborepo.dev)
[![Next.js](https://img.shields.io/badge/Next.js-v15.1-black.svg)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-v11.0-ea2845.svg)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-blue.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com)
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20العربية%20(RTL)-emerald.svg)](https://react.i18next.com)

**LifeDesk** is a modern, production-ready, full-stack monorepo application designed to solve life administration fatigue. LifeDesk manages recurring bills, subscriptions, official documents, warranties, leases, and medical appointments with deadline countdowns, automated recurring spawner engines, document vault attachments, browser push notifications, CSV data exports, and full bilingual support (English & Arabic with native RTL layouts).

---

## Architecture & Monorepo Topology

The project is structured as a **Turborepo** workspace powered by **pnpm**:

```
lifedesk/
├── apps/
│   ├── web/                     # Frontend: Next.js 15 (App Router), React 19, Tailwind CSS, TanStack Query, i18next
│   └── api/                     # Backend: NestJS 11, Prisma ORM (PostgreSQL), JWT Passport, Multer, REST Controllers
├── packages/
│   └── types/                   # Shared TypeScript DTOs, Enums (ItemType, Priority, ItemStatus, Recurrence)
├── test-e2e-api.cjs             # End-to-end API integration test runner
├── turbo.json                   # Turborepo task pipeline orchestration (build, dev, test, lint)
├── pnpm-workspace.yaml          # PNPM monorepo package registry configuration
└── package.json                 # Root script runners
```

### Shared Type Safety
Shared models and contracts reside in `packages/types` and are consumed via the workspace dependency (`@lifedesk/types: workspace:*`). When models or enums change, both the NestJS API and Next.js client retain strict end-to-end type safety.

---

## Core System Features

1. **Deadline Radar & Timeframe Categorization**
   - Immediate triage into **Due Today**, **Upcoming (Next 7 Days)**, **Overdue**, and **All Active Items**.
   - Color-coded badges indicating urgency, priority, and remaining days.

2. **1-Click Complete & Automated Recurrence Engine**
   - Completing a recurring obligation (daily, weekly, monthly, yearly) marks the current cycle as completed, records an audit log entry, and automatically schedules the next occurrence with calculated future due dates and preserved reminder thresholds.

3. **Browser Push Notifications (Web Notification API & Service Worker)**
   - Native desktop and mobile notifications alerting users before critical deadlines.
   - Interactive settings panel with permission toggles, status indicators, and test notification dispatchers.
   - Smart notification trigger on route changes with zero background polling loops while inside a page.

4. **Document Attachment Vault & Direct Uploads**
   - Attach receipts, contracts, and ID scans directly during item creation or later in the item details view.
   - Supports previewing, downloading, and deleting attachments with dynamic URL resolution.

5. **Export Commitments to CSV**
   - One-click export on the commitments table generates a timestamped `.csv` file with all titles, amounts, due dates, statuses, and recurrence intervals for offline backup.

6. **Refined App Shell UX (Isolated Scrolling)**
   - Pinned desktop sidebar and header (`h-screen overflow-hidden`) with smooth inner main viewport scrolling, eliminating unwanted whole-window page shifts.

7. **Month-at-a-Glance Obligations Calendar**
   - Interactive monthly calendar with timezone-aware date matching to inspect obligations day-by-day.

8. **Comprehensive Activity Audit Trail**
   - Chronological event timeline logging creation, updates, completions, recurrence generation, and file uploads.

9. **Bilingual & Native RTL Support (English / العربية)**
   - Complete localization powered by `i18next` and `react-i18next` with 100% key parity across English and Arabic.
   - Full right-to-left layout adaptation (`dir="rtl"`) across all pages, modals, tables, and forms with mirrored directional controls.
   - Language preferences are automatically persisted in local storage.

10. **Secure Authentication & Session Management**
    - JWT-based authentication with bcrypt password hashing.
    - Profile preference synchronization (timezone, start of week, date formats) reflected immediately across the app.
    - Password reset flow with safe, sanitized responses in production.

---

## Quick Start & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or later
- **pnpm**: `v10.x` (`npm install -g pnpm`)
- **PostgreSQL**: Local PostgreSQL server or cloud database (e.g. Neon, Supabase)

### 1. Installation
Clone the repository and install all workspace dependencies from root:

```bash
pnpm install
```

### 2. Environment Configuration
Copy the provided `.env.example` templates to set up your environment variables:

- **Backend (`apps/api/.env`)**:
  ```bash
  cp apps/api/.env.example apps/api/.env
  ```
  Configure your database credentials and JWT secret:
  ```env
  PORT=4000
  DATABASE_URL="postgresql://username:password@localhost:5432/lifedesk_db?schema=public"
  JWT_SECRET="your_strong_random_jwt_secret_key"
  JWT_EXPIRES_IN="7d"
  CORS_ORIGIN="http://localhost:3000"
  UPLOAD_DIR="./uploads"
  ```

- **Frontend (`apps/web/.env.local`)**:
  ```bash
  cp apps/web/.env.example apps/web/.env.local
  ```
  ```env
  NEXT_PUBLIC_API_URL="http://localhost:4000/api"
  ```

*(Note: Never commit real credentials or `.env` files to source control. They are strictly ignored in `.gitignore`.)*

### 3. Database Initialization
Generate the Prisma client and push the schema to your database:

```bash
pnpm --filter api run prisma:generate
pnpm --filter api run prisma:push
```

### 4. Running Development Servers

Run the entire stack concurrently:
```bash
pnpm dev
```

Or run services independently:
- **Backend API (Port 4000):** `pnpm dev:api`
- **Frontend Web (Port 3000):** `pnpm dev:web`

---

## Testing & Quality Assurance

- **End-to-End Testing (Cypress):**
  ```bash
  # Interactive GUI:
  pnpm --filter web run cypress:open

  # Headless CLI:
  pnpm test:e2e
  ```

- **Backend Unit & Service Tests (Jest):**
  ```bash
  pnpm --filter api test
  ```

- **Direct API Integration Runner:**
  ```bash
  node test-e2e-api.cjs
  ```

---

## Production Build

To validate TypeScript compilation and generate optimized production bundles:

```bash
pnpm build
```

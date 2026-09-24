# LifeDesk — Web Client Application

The **LifeDesk Web Client** is a Single Page Application built on **Next.js 15 (App Router)** and **React 19**, designed for high responsiveness, visual clarity, native browser push notifications, and full bilingual (English & Arabic) operations with native RTL rendering.

---

## Technology Stack

- **Framework:** Next.js 15.1 (App Router)
- **UI Runtime:** React 19
- **Styling:** Tailwind CSS 3.4 with custom typography, glassmorphism, and logical properties
- **Data Synchronization:** TanStack React Query 5 (caching, optimistic mutations, query invalidation)
- **Internationalization:** `i18next` & `react-i18next` with real-time `dir="rtl"` / `dir="ltr"` synchronization
- **Push Notifications:** Web Notification API + Service Worker (`sw.js`)
- **Forms & Validation:** React Hook Form
- **Icons & Micro-animations:** Lucide React & Canvas Confetti
- **End-to-End Testing:** Cypress 14

---

## Key Features

1. **Dashboard Overview & Urgency Tabs**
   - Live metrics summary: Overdue, Due Today, Upcoming, and Active Reminders.
   - Quick 1-click completion triggering confetti animation and automated recurrence scheduling.

2. **Browser Push Notifications**
   - Native desktop and mobile notifications alerting users when approaching deadlines occur.
   - Interactive controls in Account Settings to request permissions and send test notifications.
   - Smart notification trigger on route changes with zero background polling loops while inside a page.

3. **Refined Viewport Shell (Isolated Scrolling)**
   - Fixed-height layout (`h-screen overflow-hidden`) with permanently pinned sidebar and top header.
   - Scrolling is strictly confined to the `<main>` content container, eliminating unwanted whole-window page shifts.

4. **Commitments Management & CSV Export**
   - Search by title, notes, or document ID.
   - Multi-filtering by Type (Bill, Subscription, Document, Appointment, Task), Status, and Priority.
   - **Export to CSV**: Instant offline export with bilingual support.

5. **Direct File Attachments**
   - Attach documents, receipts, or PDF policies directly when creating a new commitment, or manage them later in the details view.
   - Safe viewing and downloading with dynamic API resolution.

6. **Timezone-Aware Interactive Calendar**
   - Month-by-month agenda mapping commitments using local browser date evaluation.

7. **Settings & Profile Synchronization**
   - Language switching, start of week, and timezone preferences.
   - Live state updates that reflect immediately across all dashboard components.

---

## Directory Organization

```
apps/web/
├── app/
│   ├── (auth)/                  # Authentication route group (login, register, forgot-password)
│   ├── dashboard/               # Authenticated application shell
│   │   ├── layout.tsx           # Isolated app shell with pinned sidebar, header & smooth main scroll
│   │   ├── page.tsx             # Main dashboard (metrics, tabs, 1-click completion)
│   │   ├── items/               # Commitments list with search, filters & CSV export
│   │   ├── calendar/            # Timezone-aware obligations calendar
│   │   ├── categories/          # Category manager & color tagging
│   │   ├── activity/            # Real-time event and audit timeline
│   │   └── settings/            # Profile preferences, browser push notification controls
│   ├── globals.css              # Base styling, custom scrollbars, and color variables
│   ├── layout.tsx               # Root HTML wrapper with Providers
│   └── page.tsx                 # Public landing page (features, preview, CTAs)
├── components/
│   ├── i18n-provider.tsx        # RTL/LTR document synchronizer and i18next context
│   ├── providers.tsx            # QueryClient, AuthProvider & I18nProvider stack
│   ├── items/                   # Commitment modals (CreateItemModal, ItemDetailsModal)
│   └── ui/                      # UI design system (Button, Input, Select, Modal, LanguageSwitcher, Badges)
├── lib/
│   ├── api-client.ts            # Fetch client with bearer token injection & dynamic baseURL
│   ├── auth-context.tsx         # JWT session management & instant profile updater
│   ├── i18n.ts                  # i18next configuration and local storage persistence
│   └── push-notifications.ts    # Web Notification API & Service Worker registration utility
├── locales/
│   ├── en.ts                    # English dictionary (259 keys)
│   └── ar.ts                    # Arabic dictionary with 100% key parity (259 keys)
├── public/
│   ├── sw.js                    # Service Worker handling background notifications & click events
│   └── icon.png                 # LifeDesk brand icon for notifications
└── cypress/
    ├── e2e/                     # End-to-end user journey test specs
    └── support/                 # Custom Cypress commands and test helpers
```

---

## Development & Build Cache Isolation

To prevent `next build` from colliding with an active `next dev` server, `apps/web/next.config.ts` dynamically isolates output directories:
- **`next dev`** compiles to `.next-dev/`
- **`next build`** compiles to `.next/`

This ensures that running tests, production builds, or CI checks will never wipe out running development chunks or cause 404 errors in the browser.

---

## Local Development

From the workspace root:

```bash
# Start frontend only (port 3000)
pnpm --filter web run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Setup
Create `.env.local` based on `.env.example`:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## Running Tests with Cypress

```bash
# Interactive GUI:
pnpm --filter web run cypress:open

# Headless CLI:
pnpm --filter web run cypress:run
```

---

## Production Build

```bash
pnpm --filter web run build
```

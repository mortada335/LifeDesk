# LifeDesk — API Service (NestJS)

The **LifeDesk API** is a modular REST backend built with **NestJS 11** and **Prisma ORM**, providing life management workflows, recurring obligation calculation, file attachment handling, and audit logging.

---

## Technology Stack

- **Framework:** NestJS 11
- **Language:** TypeScript 5.7
- **Database & ORM:** Prisma ORM 6 (PostgreSQL)
- **Authentication:** Passport.js with JWT Strategy (`@nestjs/passport`, `@nestjs/jwt`, `bcryptjs`)
- **File Handling:** Multer (`@nestjs/platform-express`) & Static Asset Serving
- **Validation:** `class-validator` & `class-transformer`
- **Testing:** Jest 29 & Supertest 7

---

## Directory Organization

```
apps/api/
├── prisma/
│   └── schema.prisma            # PostgreSQL models (User, Item, Category, Attachment, Activity, Notification)
├── src/
│   ├── activity/                # Audit trail event recording and query endpoints
│   ├── attachments/             # File upload, storage, and retrieval service
│   ├── auth/                    # Registration, JWT issuance, profile, and secure password reset
│   │   ├── guards/              # JwtAuthGuard & custom user decorators
│   │   └── strategies/          # Passport JWT Bearer token strategy
│   ├── categories/              # Category CRUD and color assignment
│   ├── dashboard/               # Aggregated metrics (due today, upcoming, overdue, completed)
│   ├── items/                   # Obligation CRUD, filtering, and 1-Click Complete recurrence engine
│   ├── notifications/           # Deadline reminder notifications and read status
│   ├── prisma/                  # PrismaClient lifecycle provider
│   ├── app.module.ts            # Root module registering feature modules
│   └── main.ts                  # NestJS bootstrap, validation pipes & dynamic CORS configuration
├── test/
│   ├── app.e2e-spec.ts          # NestJS E2E integration test
│   └── jest-e2e.json            # Jest E2E test runner configuration
├── .env.example                 # Sanitized environment variable template
└── package.json
```

---

## Core API Endpoints

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account and issue JWT | No |
| `POST` | `/api/auth/login` | Validate credentials and return JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `PATCH` | `/api/auth/profile` | Update user preferences (timezone, format, name) | Yes |
| `POST` | `/api/auth/change-password` | Update user security password | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset (sanitized response in production) | No |
| `POST` | `/api/auth/reset-password` | Reset password using valid reset token | No |

### 2. Obligations & Commitments (`/api/items`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/items` | Query items with `timeframe`, `search`, `type`, `status`, `priority` | Yes |
| `POST` | `/api/items` | Create new obligation with recurrence & reminder options | Yes |
| `GET` | `/api/items/:id` | Fetch single obligation with attachments and category | Yes |
| `PATCH` | `/api/items/:id` | Update obligation metadata | Yes |
| `DELETE` | `/api/items/:id` | Remove obligation | Yes |
| `POST` | `/api/items/:id/complete` | **1-Click Complete:** marks completed and spawns next recurring cycle | Yes |

### 3. Categories (`/api/categories`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/categories` | List user categories with live item counters | Yes |
| `POST` | `/api/categories` | Create custom category with color tag | Yes |
| `DELETE` | `/api/categories/:id` | Remove category | Yes |

### 4. Attachments (`/api/items/:itemId/attachments`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/items/:itemId/attachments` | Upload receipt or document (Multipart form data, 10MB limit) | Yes |
| `DELETE` | `/api/items/:itemId/attachments/:id` | Delete uploaded document and purge local file | Yes |

### 5. Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Get counts: today, upcoming, overdue, completed, and expenditure | Yes |

### 6. Activity Timeline (`/api/activity`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/activity` | Retrieve chronological audit history | Yes |

---

## Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=4000
DATABASE_URL="postgresql://username:password@localhost:5432/lifedesk_db?schema=public"
JWT_SECRET="your_strong_random_jwt_secret_key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
UPLOAD_DIR="./uploads"
```

> **Security Note:** Never commit actual database passwords or production JWT secrets to Git. The `.gitignore` file is pre-configured to exclude all `.env` files.

---

## Local Development & Database Commands

```bash
# Start API in development mode (port 4000)
pnpm --filter api run start:dev

# Push Prisma schema changes to database
pnpm --filter api run prisma:push

# Generate updated Prisma client
pnpm --filter api run prisma:generate

# Run Unit Tests
pnpm --filter api test

# Run E2E Tests
pnpm --filter api run test:e2e
```

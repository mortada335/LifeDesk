# LifeDesk Deployment Guide

Here is the complete step-by-step guide to push your project to GitHub and deploy both the Frontend and Backend using **Free** and **Paid** options.

---

### Part 1: Push the Project to GitHub

Your project is already initialized with Git and protected so that sensitive `.env` files, build outputs, and `node_modules` will not be pushed.

#### Step 1: Create the initial Git commit
Run these commands in your terminal from the project root:

```bash
git add .
git commit -m "feat: initial commit with full frontend, backend, and i18n support"
git branch -M main
```

#### Step 2: Create a repository on GitHub
1. Go to [github.com/new](https://github.com/new)
2. Enter a **Repository name** (e.g., `lifedesk`).
3. Choose **Public** or **Private**.
4. **Leave "Add a README file", ".gitignore", and "license" unchecked** (you already have them).
5. Click **Create repository**.

#### Step 3: Connect and push to GitHub
Copy your repository URL from GitHub and run:

```bash
# Replace YOUR_USERNAME and lifedesk with your actual GitHub repo URL
git remote add origin https://github.com/YOUR_USERNAME/lifedesk.git
git push -u origin main
```

*(If you use GitHub CLI `gh`, you can simply run: `gh repo create lifedesk --public --source=. --remote=origin --push`)*

---

### Part 2: Deployment Architecture Overview

Your project is a Turborepo Monorepo containing:
1. **Frontend**: Next.js (`apps/web`)
2. **Backend**: NestJS REST API (`apps/api`)
3. **Database**: PostgreSQL (managed with Prisma)

```
[User Browser] 
       │
       ▼
[Next.js Frontend] (Vercel / Cloudflare)
       │
       ▼
[NestJS Backend API] (Render / Railway / VPS)
       │
       ▼
[PostgreSQL Database] (Neon / Supabase / Render Postgres)
```

---

### Part 3: 100% FREE Hosting Guide

| Component | Free Platform | Free Limits |
| :--- | :--- | :--- |
| **PostgreSQL Database** | **[Neon.tech](https://neon.tech)** *(Recommended)* or **[Supabase](https://supabase.com)** | 0.5 GB storage, generous compute, no credit card required |
| **Backend (NestJS API)** | **[Render.com](https://render.com)** | Free Web Service (sleeps after 15 min inactivity, wakes up on request) |
| **Frontend (Next.js)** | **[Vercel](https://vercel.com)** | Unlimited deployments, global edge CDN, free SSL |

---

#### Step-by-Step Free Deployment:

#### 1. Create Free PostgreSQL Database on Neon
1. Go to [neon.tech](https://neon.tech) and sign up with your GitHub account.
2. Click **Create Project** (Name: `lifedesk-db`).
3. Under **Dashboard**, copy your connection string:
   ```text
   postgresql://alex:password@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

#### 2. Deploy Backend (NestJS) on Render.com (Free)
1. Sign up on [render.com](https://render.com) using GitHub.
2. Click **New +** → **Web Service**.
3. Connect your `lifedesk` GitHub repository.
4. Fill in the settings:
   - **Name**: `lifedesk-api`
   - **Region**: Choose closest to you (e.g. Frankfurt or Ohio)
   - **Root Directory**: `apps/api`
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install -g pnpm && pnpm install && npx prisma generate && pnpm run build
     ```
   - **Start Command**:
     ```bash
     npx prisma db push && node dist/main.js
     ```
   - **Plan**: Select **Free**.
5. Add **Environment Variables** under the Environment tab:
   - `PORT`: `4000`
   - `DATABASE_URL`: *(Paste your Neon connection string)*
   - `JWT_SECRET`: *(Generate any strong 32+ character random string)*
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGIN`: `*` *(or your Vercel frontend URL once created)*
6. Click **Create Web Service**. Once deployed, Render gives you a URL (e.g., `https://lifedesk-api.onrender.com`).

---

#### 3. Deploy Frontend (Next.js) on Vercel (Free)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New…** → **Project**, and select your `lifedesk` repo.
3. Configure the project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `apps/web`.
   - Leave build and output settings as default (Vercel automatically detects Next.js & pnpm).
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: `https://lifedesk-api.onrender.com/api` *(Your Render backend URL + `/api`)*
5. Click **Deploy**.

---

### Part 4: PAID / Production-Grade Hosting Guide

If you want:
- Zero backend spin-down delay (no cold starts)
- Custom domains with automated SSL
- Persistent file storage / S3 integration
- High performance and automatic database backups

#### Option A: Managed Cloud (Easiest, zero server maintenance)

| Service | Recommended Provider | Cost | Description |
| :--- | :--- | :--- | :--- |
| **Database** | [Neon Pro](https://neon.tech) or [Render Postgres](https://render.com) | ~$7 – $19 / month | Auto-scaling storage, point-in-time recovery, automated backups |
| **Backend API** | [Render Starter](https://render.com) or [Railway](https://railway.app) | ~$5 – $7 / month | Always-on, 512MB–1GB RAM, auto deploys on git push, health checks |
| **Frontend** | [Vercel Pro](https://vercel.com) | $20 / month *(or keep on Free Hobby tier)* | Fast Edge CDN, analytics, password protection, high bandwidth |

**Total Cost:** **~$12 – $27 / month**

---

#### Option B: Dedicated VPS with Coolify or Docker (Most cost-effective for high traffic)
Run everything on a single high-performance virtual server:

- **Provider**: [Hetzner Cloud](https://www.hetzner.com/cloud) (CPX21: 3 vCPU, 4GB RAM for ~€6/month) or [DigitalOcean Droplet](https://digitalocean.com) ($6–$12/month).
- **Deployment Tool**: **[Coolify](https://coolify.io)** (Free, open-source self-hosted alternative to Vercel/Heroku).
  - Install Coolify with a single command:
    ```bash
    curl -fsSL https://cdn.coolify.io/install.sh | bash
    ```
  - Connect your GitHub repo.
  - Coolify runs PostgreSQL, the NestJS API, and the Next.js frontend in isolated Docker containers on your single VPS, handling SSL, domain routing, and backups automatically.

**Total Cost:** **~$6 – $12 / month flat for everything**

---

### Part 5: Production Checklist

Before launching to real users:
1. **Change JWT Secret**: Make sure `JWT_SECRET` in production is an unpredictable random string.
2. **Restrict CORS**: In the backend settings, change `CORS_ORIGIN` from `*` to your actual frontend domain (e.g. `https://yourdomain.com`).
3. **Run Prisma Migrations**: Ensure `npx prisma db push` or `npx prisma migrate deploy` runs during deployment so the tables are created.


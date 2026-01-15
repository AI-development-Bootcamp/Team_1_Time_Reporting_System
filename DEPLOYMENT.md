# Deployment Guide

This guide will help you deploy the Time Reporting System using Supabase (Database), Render (Backend + Frontends), and GitHub Actions (CI/CD).

## Prerequisites
- GitHub repository connected to your project
- Accounts on [Supabase](https://supabase.com) and [Render](https://render.com)

---

## Phase 1: Database Setup (Supabase)

1. **Create a Project** in Supabase
   - Name: `time-reporting-db`
   - Save your database password!

2. **Get Connection String**
   - Go to: **Project Settings** → **Database**
   - Copy the **Prisma** connection string
   - Format: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

---

## Phase 2: Backend Deployment (Render)

1. **Create Web Service**
   - Go to Render → **New +** → **Web Service**
   - Connect your GitHub repo

2. **Configure Service**
   - **Name**: `time-reporting-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: Set to **No**

3. **Environment Variables**
   - `DATABASE_URL`: Your Supabase connection string
   - `JWT_SECRET`: A secure random string
   - `PORT`: `10000`

4. **Copy Deploy Hook**
   - In **Settings** → **Deploy Hook**
   - Save this URL for GitHub Actions

---

## Phase 3: Frontend User Deployment (Render)

1. **Create Static Site**
   - Render → **New +** → **Static Site**

2. **Configure**
   - **Name**: `time-reporting-user`
   - **Root Directory**: `frontend_user`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Auto-Deploy**: Set to **No**

3. **Environment Variables**
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://time-reporting-backend.onrender.com`)

4. **Copy Deploy Hook** (save for GitHub Actions)

---

## Phase 4: Frontend Admin Deployment (Render)

1. **Create Static Site**
   - Render → **New +** → **Static Site**

2. **Configure**
   - **Name**: `time-reporting-admin`
   - **Root Directory**: `frontend_admin`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Auto-Deploy**: Set to **No**

3. **Environment Variables**
   - `VITE_API_URL`: Your Render backend URL

4. **Copy Deploy Hook** (save for GitHub Actions)

---

## Phase 5: GitHub Actions Setup

1. **Add Secrets to GitHub**
   - Go to: **Repo Settings** → **Secrets and variables** → **Actions**
   - Add three secrets:
     - `RENDER_BACKEND_HOOK`: Backend deploy hook URL
     - `RENDER_USER_HOOK`: User frontend deploy hook URL
     - `RENDER_ADMIN_HOOK`: Admin frontend deploy hook URL

2. **Workflow File**
   - The workflow is already created at `.github/workflows/deploy.yml`
   - It will:
     - Run tests on every push to `main`
     - Deploy all services if tests pass

---

## How It Works

1. Push code to `main` branch
2. GitHub Actions runs tests
3. If tests pass → Triggers Render deployments via hooks
4. Render builds and deploys all three services

---

## Testing the Setup

After deployment, verify:
- Backend: `https://your-backend.onrender.com/health` should return `{"status":"ok"}`
- User Frontend: `https://your-user-frontend.onrender.com` should load
- Admin Frontend: `https://your-admin-frontend.onrender.com` should load

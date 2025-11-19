# 🚀 Vercel Deployment Guide - Complete Instructions

## Overview

This guide provides complete step-by-step instructions to deploy Lodgex CRM to Vercel using GitHub and Neon PostgreSQL.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: GitHub Repository Setup](#step-1-github-repository-setup)
3. [Step 2: Neon PostgreSQL Setup](#step-2-neon-postgresql-setup)
4. [Step 3: Backend Deployment](#step-3-backend-deployment)
5. [Step 4: Database Migrations](#step-4-database-migrations)
6. [Step 5: Frontend Deployment](#step-5-frontend-deployment)
7. [Step 6: Post-Deployment Configuration](#step-6-post-deployment-configuration)
8. [Step 7: Testing](#step-7-testing)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account ([sign up here](https://vercel.com/signup))
- ✅ Neon account ([sign up here](https://neon.tech))
- ✅ Git installed locally
- ✅ Node.js 18+ installed (for local testing)

---

## Step 1: GitHub Repository Setup

### 1.1 Create Repository

1. Go to [GitHub](https://github.com)
2. Click the **"+"** icon in top right → **"New repository"**
3. Fill in:
   - **Repository name**: `lodgexcrm`
   - **Description**: "Lodgex CRM - Property Management System"
   - **Visibility**: Public or Private (your choice)
   - **DO NOT** check "Initialize with README" (we already have files)
4. Click **"Create repository"**

### 1.2 Push Code to GitHub

Open terminal in your project directory:

```bash
# Navigate to project root
cd D:\lodgexcrm

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Complete Lodgex CRM system"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/lodgexcrm.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Verify**: Go to your GitHub repository and confirm all files are there.

---

## Step 2: Neon PostgreSQL Setup

### 2.1 Create Neon Account and Project

1. Go to [neon.tech](https://neon.tech)
2. Click **"Sign Up"** (or **"Log In"** if you have an account)
3. After login, click **"Create a project"**
4. Fill in:
   - **Project name**: `lodgexcrm`
   - **Region**: Choose closest to your users (e.g., `US East`)
   - **PostgreSQL version**: `15` (or latest)
5. Click **"Create project"**

### 2.2 Get Connection String

1. After project creation, you'll see a **Connection string** section
2. It looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **Click "Copy"** to copy the connection string
4. **SAVE THIS** - You'll need it for Vercel environment variables

### 2.3 (Optional) Test Connection Locally

```bash
cd backend

# Set DATABASE_URL temporarily
export DATABASE_URL="your-neon-connection-string-here"

# Test connection
npx prisma db pull

# If successful, you're connected!
```

---

## Step 3: Backend Deployment

### 3.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub

### 3.2 Import Backend Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. You'll see your GitHub repositories
3. Find `lodgexcrm` and click **"Import"**

### 3.3 Configure Backend Project

In the project configuration screen:

1. **Project Name**: `lodgexcrm-backend` (or your choice)
2. **Root Directory**: Click **"Edit"** → Select `backend`
3. **Framework Preset**: Select **"Other"**
4. **Build Command**: `npm run vercel-build`
5. **Output Directory**: Leave empty (or `dist` if needed)
6. **Install Command**: `npm install`

### 3.4 Set Environment Variables

Click **"Environment Variables"** and add these one by one:

#### Required Variables:

```bash
# Database (from Neon - Step 2.2)
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Secrets (generate these - see below)
JWT_SECRET=your-generated-jwt-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-generated-refresh-secret-minimum-32-characters

# Encryption Key (exactly 32 characters)
ENCRYPTION_KEY=your-32-character-encryption-key

# CORS (update after frontend deployment)
CORS_ORIGIN=https://lodgexcrm-frontend.vercel.app

# Environment
NODE_ENV=production
```

#### Generate Secrets:

Run these commands in terminal to generate secure secrets:

```bash
# Generate JWT Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT Refresh Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key (exactly 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy the outputs and paste into Vercel environment variables.

#### Optional Variables (can add later):

```bash
# Redis (for job queue - optional)
REDIS_URL=redis://your-redis-url:6379

# AWS S3 (for file uploads - optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET=your-bucket-name
```

**Note**: For Redis, you can use [Upstash Redis](https://upstash.com) (free tier available). For S3, you can use [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces) (cheaper alternative).

### 3.5 Deploy Backend

1. Click **"Deploy"** button
2. Wait for deployment (2-5 minutes)
3. Watch the build logs - it should show:
   - Installing dependencies
   - Running `vercel-build`
   - Generating Prisma client
   - Building TypeScript
4. Once complete, you'll see **"Ready"** status
5. **Copy the deployment URL** (e.g., `lodgexcrm-backend.vercel.app`)

### 3.6 Test Backend

Open your browser and visit:
- **Health Check**: `https://lodgexcrm-backend.vercel.app/health`
- Should return: `{"status":"ok"}`

If it works, backend is deployed! ✅

---

## Step 4: Database Migrations

### Option A: Using Neon SQL Editor (Easiest)

1. Go to [Neon Dashboard](https://console.neon.tech)
2. Click on your `lodgexcrm` project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**
5. Copy the SQL from your migration files:
   - Go to `backend/prisma/migrations/`
   - Open the latest migration folder
   - Copy contents of `migration.sql`
6. Paste into Neon SQL Editor
7. Click **"Run"**
8. Repeat for all migrations (if multiple)

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to backend
cd backend

# Link to your Vercel project
vercel link
# Select your backend project when prompted

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Option C: Add to Build Script

The `vercel-build` script already includes `prisma generate`, but migrations need to run separately. You can add a post-deploy hook or run manually.

**Verify**: Check Neon dashboard → Your database → Tables. You should see tables like `User`, `Property`, `Booking`, etc.

---

## Step 5: Frontend Deployment

### 5.1 Create New Vercel Project for Frontend

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Import the same GitHub repository (`lodgexcrm`)
3. Click **"Import"**

### 5.2 Configure Frontend Project

1. **Project Name**: `lodgexcrm-frontend` (or your choice)
2. **Root Directory**: Click **"Edit"** → Select `frontend`
3. **Framework Preset**: Should auto-detect **"Create React App"**
4. **Build Command**: `npm run build` (auto-detected)
5. **Output Directory**: `build` (auto-detected)
6. **Install Command**: `npm install` (auto-detected)

### 5.3 Set Environment Variables

Click **"Environment Variables"** and add:

```bash
# Backend API URL (use your backend URL from Step 3.5)
REACT_APP_API_URL=https://lodgexcrm-backend.vercel.app/api

# Environment
REACT_APP_ENV=production
```

**Important**: Replace `lodgexcrm-backend.vercel.app` with your actual backend URL!

### 5.4 Deploy Frontend

1. Click **"Deploy"** button
2. Wait for deployment (2-5 minutes)
3. Watch the build logs
4. Once complete, **copy the frontend URL** (e.g., `lodgexcrm-frontend.vercel.app`)

### 5.5 Test Frontend

Open your browser and visit:
- **Frontend**: `https://lodgexcrm-frontend.vercel.app`
- Should see the login page

---

## Step 6: Post-Deployment Configuration

### 6.1 Update Backend CORS

1. Go to Vercel dashboard → Your **backend project**
2. Go to **Settings** → **Environment Variables**
3. Find `CORS_ORIGIN`
4. Update it to your frontend URL:
   ```
   CORS_ORIGIN=https://lodgexcrm-frontend.vercel.app
   ```
5. Go to **Deployments** tab
6. Click **"Redeploy"** on the latest deployment
7. Or Vercel will auto-redeploy when you save

### 6.2 (Optional) Seed Database

To create an admin user, you can:

**Option A: Via API** (after backend is deployed)
```bash
curl -X POST https://lodgexcrm-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lodgexcrm.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Option B: Via Vercel CLI**
```bash
cd backend
vercel env pull .env.local
npm run seed
```

---

## Step 7: Testing

### 7.1 Test All Endpoints

1. **Health Check**:
   ```
   https://lodgexcrm-backend.vercel.app/health
   ```
   Expected: `{"status":"ok"}`

2. **API Documentation**:
   ```
   https://lodgexcrm-backend.vercel.app/api/docs
   ```
   Expected: Swagger UI

3. **Frontend**:
   ```
   https://lodgexcrm-frontend.vercel.app
   ```
   Expected: Login page

### 7.2 Test Login

1. Go to your frontend URL
2. Use credentials:
   - **Email**: `admin@lodgexcrm.com`
   - **Password**: `admin123`
   (Or register a new account)
3. Should successfully login and see dashboard

### 7.3 Test Features

- ✅ Create a property
- ✅ Create a booking
- ✅ View dashboard
- ✅ Check analytics
- ✅ Test all CRUD operations

---

## Troubleshooting

### Backend Issues

**Problem**: Build fails
- **Solution**: Check build logs in Vercel
- Ensure `vercel-build` script exists in `package.json`
- Check that Prisma is installed

**Problem**: Database connection fails
- **Solution**: 
  - Verify `DATABASE_URL` format is correct
  - Check Neon project is active (not paused)
  - Ensure SSL mode is `require` in connection string
  - Check environment variable is set correctly

**Problem**: 500 errors
- **Solution**:
  - Check Vercel function logs
  - Verify all environment variables are set
  - Check database migrations have run

### Frontend Issues

**Problem**: Blank page
- **Solution**:
  - Check browser console for errors
  - Verify `REACT_APP_API_URL` is correct
  - Check build completed successfully

**Problem**: API calls fail (CORS errors)
- **Solution**:
  - Verify `CORS_ORIGIN` in backend matches frontend URL
  - Check backend is redeployed after CORS change
  - Ensure `REACT_APP_API_URL` includes `/api`

**Problem**: 401 Unauthorized
- **Solution**:
  - Check JWT secrets are set correctly
  - Verify tokens are being sent in requests
  - Check token expiration settings

### Database Issues

**Problem**: Migrations fail
- **Solution**:
  - Check Prisma schema is correct
  - Verify database user has permissions
  - Run migrations manually via Neon SQL Editor

**Problem**: Tables not created
- **Solution**:
  - Verify migrations have run
  - Check Neon dashboard for tables
  - Run `npx prisma migrate deploy` via CLI

---

## 🎉 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Neon database created and connection string copied
- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set
- [ ] Database migrations run successfully
- [ ] Backend health check passes
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] Backend CORS updated with frontend URL
- [ ] Frontend loads correctly
- [ ] Login functionality works
- [ ] All features tested

---

## 📞 Next Steps

After successful deployment:

1. **Set up custom domains** (optional)
2. **Configure monitoring** (Vercel Analytics, Sentry)
3. **Set up backups** (Neon automatic backups)
4. **Configure alerts** (for errors and downtime)
5. **Add SSL certificates** (automatic with Vercel)

---

## 🔗 Useful Links

- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Neon Dashboard**: [console.neon.tech](https://console.neon.tech)
- **GitHub Repository**: Your repo URL
- **Backend API**: `https://your-backend.vercel.app/api`
- **Frontend App**: `https://your-frontend.vercel.app`
- **API Docs**: `https://your-backend.vercel.app/api/docs`

---

**Congratulations! Your Lodgex CRM is now live! 🎉**

For quick deployment, see [QUICK_DEPLOY.md](QUICK_DEPLOY.md)


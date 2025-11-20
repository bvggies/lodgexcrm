# Quick Database Setup Guide

## Your Neon Database

**Connection String:**
```
postgresql://neondb_owner:npg_0DZkHhcsNP7W@ep-royal-sky-ahp86q9n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Quick Setup Steps

### 1. Test Connection Locally

```bash
cd backend

# Set environment variable
$env:DATABASE_URL="postgresql://neondb_owner:npg_0DZkHhcsNP7W@ep-royal-sky-ahp86q9n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Test connection
npx prisma db pull
```

### 2. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 3. Seed Database (Optional)

```bash
npm run seed
```

### 4. For Vercel Deployment

1. Go to Vercel Dashboard → Your Backend Project
2. **Settings** → **Environment Variables**
3. Add:
   ```
   DATABASE_URL = postgresql://neondb_owner:npg_0DZkHhcsNP7W@ep-royal-sky-ahp86q9n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Select all environments (Production, Preview, Development)
5. Save and redeploy

### 5. Run Migrations on Vercel

After deployment, run migrations:

**Option A: Using Vercel CLI**
```bash
cd backend
vercel login
vercel link
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B: Using Neon SQL Editor**
1. Go to [Neon Console](https://console.neon.tech)
2. Open your project
3. Click **SQL Editor**
4. Copy migration SQL from `backend/prisma/migrations/` folders
5. Paste and run

## Verify Setup

After migrations, verify tables were created:

```bash
npx prisma studio
```

Or check in Neon Console → **Tables** section.

## Default Admin User

After seeding, login with:
- **Email**: `admin@lodgexcrm.com`
- **Password**: `admin123`

⚠️ **Change this password in production!**


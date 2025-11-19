# 🚀 Complete Deployment Guide: Lodgex CRM to Vercel

This guide will walk you through deploying the Lodgex CRM application using:
- **Vercel** - For hosting frontend and backend
- **GitHub** - For version control and CI/CD
- **Neon PostgreSQL** - For database hosting

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ Neon account (sign up at [neon.tech](https://neon.tech))
- ✅ Node.js installed locally (for testing)
- ✅ Git installed

---

## Step 1: Set Up GitHub Repository

### 1.1 Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon → **"New repository"**
3. Repository name: `lodgexcrm` (or your preferred name)
4. Description: "Lodgex CRM - Property Management System"
5. Set to **Public** (or Private if you prefer)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

### 1.2 Push Code to GitHub

```bash
# Navigate to your project root
cd D:\lodgexcrm

# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Complete Lodgex CRM system"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/lodgexcrm.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up Neon PostgreSQL Database

### 2.1 Create Neon Account and Project

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click **"Create a project"**
3. Project name: `lodgexcrm`
4. Select region closest to your users (e.g., `US East (N. Virginia)`)
5. PostgreSQL version: **15** (or latest)
6. Click **"Create project"**

### 2.2 Get Database Connection String

1. After project creation, you'll see the **Connection string**
2. It will look like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **Copy this connection string** - you'll need it later
4. Click **"Connection Details"** to see:
   - Host
   - Database name
   - User
   - Password

### 2.3 Test Database Connection

```bash
# Navigate to backend
cd backend

# Install dependencies if not done
npm install

# Set temporary DATABASE_URL (replace with your Neon connection string)
export DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# (Optional) Seed database
npm run seed
```

---

## Step 3: Prepare Backend for Vercel

### 3.1 Create Vercel Configuration

Create `backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/server.ts"
    },
    {
      "src": "/health",
      "dest": "src/server.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3.2 Update Backend Server for Vercel

The server should already be compatible, but ensure `backend/src/server.ts` exports the app:

```typescript
// Make sure this is at the end of server.ts
export default app;
```

### 3.3 Update Package.json Scripts

Ensure `backend/package.json` has:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "vercel-build": "prisma generate && npm run build"
  }
}
```

---

## Step 4: Prepare Frontend for Vercel

### 4.1 Create Vercel Configuration

Create `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "devCommand": "npm start",
  "installCommand": "npm install",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4.2 Update Frontend Environment

Create `frontend/.env.production`:

```env
REACT_APP_API_URL=https://your-backend.vercel.app/api
REACT_APP_ENV=production
```

**Note**: Replace `your-backend.vercel.app` with your actual backend Vercel URL (you'll get this after deploying backend).

---

## Step 5: Deploy Backend to Vercel

### 5.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`lodgexcrm`)
4. Click **"Import"**

### 5.2 Configure Backend Project

1. **Project Name**: `lodgexcrm-backend` (or your choice)
2. **Root Directory**: Select `backend`
3. **Framework Preset**: Select **"Other"**
4. **Build Command**: `npm run vercel-build`
5. **Output Directory**: Leave empty (or `dist` if needed)
6. **Install Command**: `npm install`

### 5.3 Set Environment Variables

Click **"Environment Variables"** and add:

```
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-character-encryption-key!!
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend.vercel.app
REDIS_URL=redis://your-redis-url:6379
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_BUCKET=your-bucket-name
```

**Important Notes**:
- Replace `DATABASE_URL` with your Neon connection string
- Generate strong secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ characters)
- Generate exactly 32 characters for `ENCRYPTION_KEY`
- Replace `CORS_ORIGIN` with your frontend URL (you'll update this after deploying frontend)
- For Redis, you can use [Upstash Redis](https://upstash.com) (free tier available) or skip if not using automations
- For AWS S3, use [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces) (cheaper) or skip if not using file uploads

### 5.4 Deploy Backend

1. Click **"Deploy"**
2. Wait for deployment to complete (2-5 minutes)
3. Once deployed, copy the **deployment URL** (e.g., `lodgexcrm-backend.vercel.app`)
4. Test the health endpoint: `https://lodgexcrm-backend.vercel.app/health`

### 5.5 Run Database Migrations

After first deployment, you need to run migrations:

**Option A: Using Vercel CLI** (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
cd backend
vercel link

# Run migrations
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B: Using Neon Console**
1. Go to Neon dashboard
2. Click on your project
3. Go to **"SQL Editor"**
4. Run migrations manually (copy from `backend/prisma/migrations`)

**Option C: Add Migration Script to Vercel**
Create `backend/scripts/migrate.sh`:
```bash
#!/bin/bash
npx prisma migrate deploy
npx prisma generate
```

Then add to `vercel.json`:
```json
{
  "builds": [
    {
      "src": "scripts/migrate.sh",
      "use": "@vercel/static-build"
    }
  ]
}
```

---

## Step 6: Deploy Frontend to Vercel

### 6.1 Create New Vercel Project for Frontend

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Import the same GitHub repository (`lodgexcrm`)
3. Click **"Import"**

### 6.2 Configure Frontend Project

1. **Project Name**: `lodgexcrm-frontend` (or your choice)
2. **Root Directory**: Select `frontend`
3. **Framework Preset**: Select **"Create React App"**
4. **Build Command**: `npm run build` (auto-detected)
5. **Output Directory**: `build` (auto-detected)
6. **Install Command**: `npm install` (auto-detected)

### 6.3 Set Environment Variables

Click **"Environment Variables"** and add:

```
REACT_APP_API_URL=https://lodgexcrm-backend.vercel.app/api
REACT_APP_ENV=production
```

**Important**: Replace `lodgexcrm-backend.vercel.app` with your actual backend URL from Step 5.4

### 6.4 Deploy Frontend

1. Click **"Deploy"**
2. Wait for deployment to complete (2-5 minutes)
3. Once deployed, copy the **deployment URL** (e.g., `lodgexcrm-frontend.vercel.app`)

### 6.5 Update Backend CORS

1. Go back to your **backend project** in Vercel
2. Go to **Settings** → **Environment Variables**
3. Update `CORS_ORIGIN` to your frontend URL:
   ```
   CORS_ORIGIN=https://lodgexcrm-frontend.vercel.app
   ```
4. **Redeploy** the backend (Vercel will auto-redeploy or click "Redeploy")

---

## Step 7: Post-Deployment Setup

### 7.1 Seed Database (Optional)

To create an admin user, you can:

**Option A: Use Vercel CLI**
```bash
cd backend
vercel env pull .env.local
npm run seed
```

**Option B: Create Admin via API**
```bash
# Register admin user
curl -X POST https://lodgexcrm-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lodgexcrm.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### 7.2 Verify Deployment

1. **Backend Health Check**:
   ```
   https://lodgexcrm-backend.vercel.app/health
   ```
   Should return: `{"status":"ok"}`

2. **Frontend**:
   ```
   https://lodgexcrm-frontend.vercel.app
   ```
   Should load the login page

3. **API Documentation**:
   ```
   https://lodgexcrm-backend.vercel.app/api/docs
   ```
   Should show Swagger documentation

### 7.3 Test Login

1. Go to your frontend URL
2. Use default credentials (or the one you created):
   - Email: `admin@lodgexcrm.com`
   - Password: `admin123`
3. You should be able to login and access the dashboard

---

## Step 8: Configure Custom Domains (Optional)

### 8.1 Add Custom Domain to Frontend

1. In Vercel, go to your **frontend project**
2. Go to **Settings** → **Domains**
3. Add your domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration instructions
5. Update `CORS_ORIGIN` in backend to match

### 8.2 Add Custom Domain to Backend

1. In Vercel, go to your **backend project**
2. Go to **Settings** → **Domains**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions
5. Update `REACT_APP_API_URL` in frontend to match

---

## Step 9: Set Up Continuous Deployment

### 9.1 Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Vercel will automatically deploy both frontend and backend
```

### 9.2 Preview Deployments

- Every pull request gets a preview deployment
- Test changes before merging to main

---

## Step 10: Monitoring and Maintenance

### 10.1 Vercel Analytics

1. Go to your project in Vercel
2. Enable **Analytics** (if on Pro plan)
3. Monitor performance and errors

### 10.2 Database Monitoring

1. Go to Neon dashboard
2. Monitor database usage
3. Set up alerts for high usage

### 10.3 Error Tracking

Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Vercel Analytics** for performance

---

## 🔧 Troubleshooting

### Backend Deployment Issues

**Issue**: Build fails
- **Solution**: Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check that `vercel-build` script exists

**Issue**: Database connection fails
- **Solution**: Verify `DATABASE_URL` is correct
- Check Neon database is running
- Ensure SSL mode is `require`

**Issue**: Migrations not running
- **Solution**: Add migration step to `vercel-build` script
- Or run migrations manually via Neon SQL Editor

### Frontend Deployment Issues

**Issue**: API calls fail
- **Solution**: Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is deployed and accessible

**Issue**: Blank page
- **Solution**: Check browser console for errors
- Verify build completed successfully
- Check environment variables

### Database Issues

**Issue**: Connection timeout
- **Solution**: Check Neon project is active
- Verify connection string is correct
- Check firewall settings

**Issue**: Migration errors
- **Solution**: Check Prisma schema is correct
- Verify database user has proper permissions
- Check migration files are correct

---

## 📝 Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-secret-key-here` |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars) | `your-refresh-secret-here` |
| `ENCRYPTION_KEY` | AES encryption key (exactly 32 chars) | `12345678901234567890123456789012` |
| `NODE_ENV` | Environment | `production` |
| `CORS_ORIGIN` | Frontend URL | `https://your-frontend.vercel.app` |

### Backend Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `REDIS_URL` | Redis connection (for BullMQ) | - |
| `AWS_ACCESS_KEY_ID` | S3 access key | - |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key | - |
| `AWS_REGION` | AWS region | - |
| `AWS_BUCKET` | S3 bucket name | - |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://your-backend.vercel.app/api` |

---

## 🎯 Quick Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] Neon PostgreSQL database created
- [ ] Database connection string copied
- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set
- [ ] Database migrations run
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] Backend CORS updated with frontend URL
- [ ] Health endpoint tested
- [ ] Frontend loads correctly
- [ ] Login functionality tested
- [ ] Custom domains configured (optional)

---

## 🚀 Deployment URLs

After deployment, you'll have:

- **Frontend**: `https://lodgexcrm-frontend.vercel.app`
- **Backend API**: `https://lodgexcrm-backend.vercel.app/api`
- **API Docs**: `https://lodgexcrm-backend.vercel.app/api/docs`
- **Health Check**: `https://lodgexcrm-backend.vercel.app/health`

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Neon database logs
3. Review error messages in browser console
4. Verify all environment variables are set correctly
5. Ensure database migrations have run

---

**Congratulations!** 🎉 Your Lodgex CRM is now live!


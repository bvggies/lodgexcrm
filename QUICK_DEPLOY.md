# ⚡ Quick Deployment Guide

## 🎯 Fast Track Deployment (15 minutes)

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Neon account (free tier works)

---

## Step 1: Push to GitHub (2 minutes)

```bash
# If not already done
cd D:\lodgexcrm
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/lodgexcrm.git
git push -u origin main
```

---

## Step 2: Set Up Neon Database (3 minutes)

1. Go to [neon.tech](https://neon.tech) → Sign up
2. Click **"Create Project"**
3. Name: `lodgexcrm`
4. Copy the **Connection String** (looks like `postgresql://...`)

---

## Step 3: Deploy Backend (5 minutes)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. **Root Directory**: `backend`
4. **Framework**: Other
5. **Build Command**: `npm run vercel-build`
6. **Environment Variables**:
   ```
   DATABASE_URL=your-neon-connection-string
   JWT_SECRET=generate-32-char-random-string
   JWT_REFRESH_SECRET=generate-32-char-random-string
   ENCRYPTION_KEY=exactly-32-characters-long!!
   CORS_ORIGIN=https://your-frontend.vercel.app
   NODE_ENV=production
   ```
7. Click **Deploy**
8. **Copy the backend URL** (e.g., `lodgexcrm-backend.vercel.app`)

**Generate Secrets**:
```bash
# Generate JWT secrets (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (exactly 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Step 4: Run Database Migrations (2 minutes)

**Option A: Using Neon SQL Editor** (Easiest)
1. Go to Neon dashboard → Your project
2. Click **"SQL Editor"**
3. Copy contents of `backend/prisma/migrations/*/migration.sql`
4. Paste and run

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
cd backend
vercel login
vercel link
vercel env pull .env.local
npx prisma migrate deploy
```

---

## Step 5: Deploy Frontend (3 minutes)

1. In Vercel → **Add New Project**
2. Import same GitHub repo
3. **Root Directory**: `frontend`
4. **Framework**: Create React App (auto-detected)
5. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://YOUR-BACKEND-URL.vercel.app/api
   ```
   (Replace with your actual backend URL from Step 3)
6. Click **Deploy**
7. **Copy the frontend URL**

---

## Step 6: Update CORS (1 minute)

1. Go to backend project in Vercel
2. **Settings** → **Environment Variables**
3. Update `CORS_ORIGIN` to your frontend URL
4. **Redeploy** backend

---

## Step 7: Test (1 minute)

1. Visit your frontend URL
2. Login with:
   - Email: `admin@lodgexcrm.com`
   - Password: `admin123`
   (Or create account via register)

---

## ✅ Done!

Your app is now live at:
- Frontend: `https://your-frontend.vercel.app`
- Backend: `https://your-backend.vercel.app/api`

---

## 🔧 Troubleshooting

**Backend won't deploy?**
- Check build logs in Vercel
- Ensure `vercel-build` script exists in `package.json`

**Database connection fails?**
- Verify `DATABASE_URL` is correct
- Check Neon project is active

**Frontend can't connect to backend?**
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings match frontend URL

**Need help?** See `DEPLOYMENT_GUIDE.md` for detailed steps.


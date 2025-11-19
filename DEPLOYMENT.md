# Deployment Guide

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database (Neon recommended)
- S3-compatible storage (AWS S3, DigitalOcean Spaces)
- GitHub account
- Vercel account

## Environment Setup

### Backend Environment Variables

Create `backend/.env` with the following:

```env
NODE_ENV=production
PORT=5000
API_BASE_URL=https://your-api-domain.com

# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Storage (S3-compatible)
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=lodgexcrm-uploads
AWS_S3_ENDPOINT=

# Redis (for BullMQ job queue)
REDIS_URL=redis://localhost:6379

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@lodgexcrm.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend Environment Variables

Create `frontend/.env` with:

```env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_ENV=production
```

## Database Setup

1. Create a Neon Postgres database
2. Copy the connection string to `DATABASE_URL`
3. Run migrations:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run seed
```

## Vercel Deployment

### Frontend

1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Add environment variables in Vercel dashboard
4. Deploy

### Backend (Serverless Functions)

1. Ensure `vercel.json` is configured correctly
2. Set environment variables in Vercel dashboard
3. Deploy backend functions

## GitHub Actions CI/CD

The CI pipeline runs automatically on push to `main` or `dev` branches:

- Runs linters
- Runs tests
- Validates TypeScript compilation

## Manual Deployment Steps

1. **Build backend:**
```bash
cd backend
npm run build
```

2. **Build frontend:**
```bash
cd frontend
npm run build
```

3. **Deploy to Vercel:**
```bash
vercel --prod
```

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Admin user created (via seed script)
- [ ] File storage configured and tested
- [ ] API endpoints accessible
- [ ] Frontend can connect to backend
- [ ] Authentication working
- [ ] File uploads working

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` includes `?sslmode=require`
- Check firewall rules allow connections
- Verify credentials are correct

### File Upload Issues

- Verify S3 credentials are correct
- Check bucket permissions
- Verify CORS settings on S3 bucket

### Authentication Issues

- Verify JWT secrets are set
- Check token expiration settings
- Verify CORS origin matches frontend URL


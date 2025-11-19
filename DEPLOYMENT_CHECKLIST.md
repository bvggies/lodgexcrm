# Deployment Checklist

## Pre-Deployment

### Backend Setup
- [ ] Set up production PostgreSQL database (Neon)
- [ ] Configure all environment variables in Vercel
- [ ] Set up Redis instance (for BullMQ)
- [ ] Configure S3-compatible storage (AWS S3 or DigitalOcean Spaces)
- [ ] Set up SMTP for email notifications
- [ ] Configure Twilio for SMS (optional)

### Frontend Setup
- [ ] Set `REACT_APP_API_URL` to production API URL
- [ ] Build and test production build locally
- [ ] Verify all API endpoints are accessible

### Database
- [ ] Run production migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Seed initial admin user: `npm run seed`
- [ ] Verify database connections

### Security
- [ ] Ensure all secrets are in environment variables (not in code)
- [ ] Verify JWT secrets are strong (32+ characters)
- [ ] Verify encryption key is exactly 32 characters
- [ ] Review and update CORS origins
- [ ] Enable rate limiting
- [ ] Review API authentication

## Deployment Steps

### 1. Backend Deployment (Vercel)
```bash
cd backend
vercel --prod
```

### 2. Frontend Deployment (Vercel)
```bash
cd frontend
vercel --prod
```

### 3. Post-Deployment
- [ ] Verify health endpoint: `https://your-api.vercel.app/health`
- [ ] Test authentication flow
- [ ] Verify database connections
- [ ] Test file uploads
- [ ] Verify job queue (Redis) connection
- [ ] Test integrations (if configured)

## Environment Variables Checklist

### Backend (Required)
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `ENCRYPTION_KEY` (32 characters)

### Backend (Optional but Recommended)
- [ ] `REDIS_URL`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION`
- [ ] `AWS_BUCKET`
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`

### Frontend (Required)
- [ ] `REACT_APP_API_URL`

## Monitoring Setup

- [ ] Set up error tracking (e.g., Sentry)
- [ ] Set up application monitoring
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Configure alerts for critical errors

## Backup Strategy

- [ ] Set up automated database backups
- [ ] Configure backup retention policy
- [ ] Test backup restoration process
- [ ] Document recovery procedures

## Documentation

- [ ] Update API documentation with production URLs
- [ ] Document production environment setup
- [ ] Create runbook for common issues
- [ ] Document rollback procedures

## Testing

- [ ] Run all tests: `npm test`
- [ ] Test critical user flows
- [ ] Verify all exports work
- [ ] Test integrations (if configured)
- [ ] Load testing (optional)

## Go-Live

- [ ] Final verification of all features
- [ ] Notify stakeholders
- [ ] Monitor for first 24 hours
- [ ] Collect user feedback
- [ ] Document any issues

---

**Note**: This checklist should be reviewed and customized based on your specific deployment requirements.


# Lodgex CRM

> **Status**: ✅ Production Ready | **Version**: 1.0.0

A comprehensive Property Management CRM system built with React, Node.js, and PostgreSQL.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Set up environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your credentials

# Set up database
cd backend
npx prisma migrate dev
npx prisma generate
npm run seed

# Start development servers
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Production Deployment

**See detailed deployment guides:**
- 📖 **[Complete Deployment Guide](DEPLOYMENT_GUIDE.md)** - Step-by-step guide for Vercel + GitHub + Neon
- ⚡ **[Quick Deployment Guide](QUICK_DEPLOY.md)** - Fast track deployment (15 minutes)

## 📋 Features

### Core Features
- ✅ Property Management
- ✅ Unit Management
- ✅ Guest Management
- ✅ Booking Management (with Calendar)
- ✅ Owner Management
- ✅ Staff Management
- ✅ Cleaning Tasks
- ✅ Maintenance Tasks
- ✅ Finance Management (with Charts & Export)
- ✅ Analytics & Reporting (with Export)
- ✅ Audit Logging
- ✅ Integrations (Airbnb, Booking.com)
- ✅ Automations
- ✅ Archive Management

### UI/UX Features
- ✅ Smooth page transitions
- ✅ Staggered animations
- ✅ Hover effects
- ✅ Loading states
- ✅ Searchable dropdowns
- ✅ Dynamic field loading
- ✅ Form validations
- ✅ Error handling

### Security Features
- ✅ JWT authentication
- ✅ Password hashing
- ✅ Role-based authorization
- ✅ Encrypted sensitive data
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Redux Toolkit
- Ant Design
- React Router
- Framer Motion
- AOS (Animate On Scroll)
- Recharts
- React Big Calendar

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL (Neon)
- JWT Authentication
- BullMQ (Job Queue)
- Redis
- Swagger (API Documentation)

## 📁 Project Structure

```
lodgexcrm/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── utils/          # Utilities
│   │   └── server.ts       # Express server
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   ├── utils/           # Utilities
│   │   └── App.tsx         # Main app component
│   └── package.json
└── README.md
```

## 🔐 Default Credentials

After seeding the database:
- **Email**: `admin@lodgexcrm.com`
- **Password**: `admin123`

**⚠️ Change these in production!**

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment guide
- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Quick deployment (15 min)
- **[PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)** - Production checklist
- **[DEPLOYMENT_READY.md](DEPLOYMENT_READY.md)** - Deployment status
- **[SYSTEM_COMPLETE.md](SYSTEM_COMPLETE.md)** - System completion summary

## 🌐 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/health`

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-32-char-key
REDIS_URL=redis://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

See `.env.example` files for complete list.

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy Backend**
   - Go to Vercel → Import GitHub repo
   - Root Directory: `backend`
   - Set environment variables
   - Deploy

3. **Deploy Frontend**
   - Go to Vercel → Import GitHub repo
   - Root Directory: `frontend`
   - Set `REACT_APP_API_URL` to backend URL
   - Deploy

**See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed steps.**

## 📊 System Requirements

- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for job queue)
- S3-compatible storage (optional, for file uploads)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software.

## 👥 Authors

- Lodgex CRM Development Team

## 🙏 Acknowledgments

- Ant Design for UI components
- Prisma for ORM
- Vercel for hosting
- Neon for PostgreSQL hosting

---

**For deployment help, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**

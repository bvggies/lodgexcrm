import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import filesRoutes from './routes/files.routes';
import propertiesRoutes from './routes/properties.routes';
import guestsRoutes from './routes/guests.routes';
import ownersRoutes from './routes/owners.routes';
import unitsRoutes from './routes/units.routes';
import staffRoutes from './routes/staff.routes';
import bookingsRoutes from './routes/bookings.routes';
import cleaningRoutes from './routes/cleaning.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import financeRoutes from './routes/finance.routes';
import analyticsRoutes from './routes/analytics.routes';
import integrationsRoutes from './routes/integrations.routes';
import webhooksRoutes from './routes/webhooks.routes';
import automationsRoutes from './routes/automations.routes';
import auditRoutes from './routes/audit.routes';
import archiveRoutes from './routes/archive.routes';
import importRoutes from './routes/import.routes';

// Load environment variables
dotenv.config();

// Validate environment variables (non-blocking in production)
import { validateEnv } from './utils/envValidation';
try {
  validateEnv();
} catch (error: any) {
  console.error('❌ Environment validation failed:');
  console.error(error.message);
  // Don't exit in production/Vercel - let it fail gracefully
  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lodgex CRM API',
      version: '1.0.0',
      description: 'Property Management CRM API',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lodgex CRM API', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Lodgex CRM API', version: '1.0.0' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// File upload routes
app.use('/api/files', filesRoutes);

// Core CRUD routes
app.use('/api/properties', propertiesRoutes);
app.use('/api/guests', guestsRoutes);
app.use('/api/owners', ownersRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/cleaning', cleaningRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/automations', automationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/archive', archiveRoutes);

// Import routes (admin only)
app.use('/api/import', importRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize scheduled jobs
async function initializeJobs() {
  try {
    const { automationService } = await import('./services/automations/automation.service');
    await automationService.scheduleRecurringJobs();
    console.log('✅ Scheduled jobs initialized');
  } catch (error) {
    console.error('❌ Failed to initialize scheduled jobs:', error);
  }
}

// Start server
// Only start server if not in serverless environment (Vercel)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize scheduled jobs
    await initializeJobs();
  });
} else {
  // In serverless environment, initialize jobs without listening
  initializeJobs().catch(console.error);
}

export default app;


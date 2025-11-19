import { Request, Response, NextFunction } from 'express';
import { airbnbService } from '../services/integrations/airbnb.service';
import { bookingComService } from '../services/integrations/bookingcom.service';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { IntegrationType, IntegrationStatus } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';
import { auditLog } from '../middleware/audit';

export const syncAirbnb = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyMapping } = req.body;

    if (!propertyMapping || typeof propertyMapping !== 'object') {
      return next(createError('Property mapping is required', 400));
    }

    // Get integration config
    const integration = await prisma.integration.findUnique({
      where: { type: IntegrationType.airbnb },
    });

    if (!integration || !integration.isActive || !integration.apiKey || !integration.apiSecret) {
      return next(createError('Airbnb integration is not configured or not active', 400));
    }

    // Decrypt credentials
    const apiKey = decrypt(integration.apiKey);
    const apiSecret = decrypt(integration.apiSecret);

    // Create sync history record
    const syncHistory = await prisma.integrationSyncHistory.create({
      data: {
        integrationId: integration.id,
        status: 'in_progress',
      },
    });

    try {
      // Create service instance with decrypted credentials
      const service = new (await import('../services/integrations/airbnb.service')).AirbnbService(apiKey, apiSecret);
      const result = await service.syncBookings(propertyMapping);

      // Update sync history
      await prisma.integrationSyncHistory.update({
        where: { id: syncHistory.id },
        data: {
          completedAt: new Date(),
          status: result.success ? (result.errors.length > 0 ? 'partial' : 'success') : 'error',
          created: result.created,
          updated: result.updated,
          errors: result.errors.length > 0 ? result.errors : undefined,
        },
      });

      // Update integration last sync info
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: result.success ? 'success' : 'error',
          lastSyncError: result.errors.length > 0 ? result.errors.join('; ') : null,
        },
      });

      res.json({
        success: result.success,
        data: result,
        message: `Sync completed: ${result.created} created, ${result.updated} updated`,
      });
    } catch (error: any) {
      // Update sync history with error
      await prisma.integrationSyncHistory.update({
        where: { id: syncHistory.id },
        data: {
          completedAt: new Date(),
          status: 'error',
          errors: [error.message],
        },
      });

      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'error',
          lastSyncError: error.message,
        },
      });

      throw error;
    }
  } catch (error: any) {
    next(error);
  }
};

export const syncBookingCom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyMapping } = req.body;

    if (!propertyMapping || typeof propertyMapping !== 'object') {
      return next(createError('Property mapping is required', 400));
    }

    // Get integration config
    const integration = await prisma.integration.findUnique({
      where: { type: IntegrationType.booking_com },
    });

    if (!integration || !integration.isActive || !integration.apiKey || !integration.apiSecret) {
      return next(createError('Booking.com integration is not configured or not active', 400));
    }

    // Decrypt credentials
    const apiKey = decrypt(integration.apiKey);
    const apiSecret = decrypt(integration.apiSecret);

    // Create sync history record
    const syncHistory = await prisma.integrationSyncHistory.create({
      data: {
        integrationId: integration.id,
        status: 'in_progress',
      },
    });

    try {
      // Create service instance with decrypted credentials
      const service = new (await import('../services/integrations/bookingcom.service')).BookingComService(apiKey, apiSecret);
      const result = await service.syncBookings(propertyMapping);

      // Update sync history
      await prisma.integrationSyncHistory.update({
        where: { id: syncHistory.id },
        data: {
          completedAt: new Date(),
          status: result.success ? (result.errors.length > 0 ? 'partial' : 'success') : 'error',
          created: result.created,
          updated: result.updated,
          errors: result.errors.length > 0 ? result.errors : undefined,
        },
      });

      // Update integration last sync info
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: result.success ? 'success' : 'error',
          lastSyncError: result.errors.length > 0 ? result.errors.join('; ') : null,
        },
      });

      res.json({
        success: result.success,
        data: result,
        message: `Sync completed: ${result.created} created, ${result.updated} updated`,
      });
    } catch (error: any) {
      // Update sync history with error
      await prisma.integrationSyncHistory.update({
        where: { id: syncHistory.id },
        data: {
          completedAt: new Date(),
          status: 'error',
          errors: [error.message],
        },
      });

      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'error',
          lastSyncError: error.message,
        },
      });

      throw error;
    }
  } catch (error: any) {
    next(error);
  }
};

export const handleAirbnbWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payload = req.body;

    // In production, verify webhook signature here
    // const signature = req.headers['x-airbnb-signature'];
    // if (!airbnbService.verifySignature(payload, signature)) {
    //   return res.status(401).json({ success: false, message: 'Invalid signature' });
    // }

    const result = await airbnbService.processWebhook(payload);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error: any) {
    next(error);
  }
};

export const handleBookingComWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payload = req.body;

    // In production, verify webhook signature here
    // const signature = req.headers['x-bookingcom-signature'];
    // if (!bookingComService.verifySignature(payload, signature)) {
    //   return res.status(401).json({ success: false, message: 'Invalid signature' });
    // }

    const result = await bookingComService.processWebhook(payload);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error: any) {
    next(error);
  }
};

export const getIntegrationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const integrations = await prisma.integration.findMany({
      orderBy: { type: 'asc' },
      include: {
        syncHistory: {
          take: 5,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    // Format response
    const formatted = integrations.map((integration) => ({
      id: integration.id,
      type: integration.type,
      name: integration.name,
      isActive: integration.isActive,
      status: integration.status,
      configured: integration.status !== 'not_configured',
      lastSyncAt: integration.lastSyncAt,
      lastSyncStatus: integration.lastSyncStatus,
      lastSyncError: integration.lastSyncError,
      recentSyncs: integration.syncHistory.map((sync) => ({
        id: sync.id,
        startedAt: sync.startedAt,
        completedAt: sync.completedAt,
        status: sync.status,
        created: sync.created,
        updated: sync.updated,
      })),
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getIntegration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type } = req.params;

    const integration = await prisma.integration.findUnique({
      where: { type: type as IntegrationType },
      include: {
        syncHistory: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!integration) {
      return next(createError('Integration not found', 404));
    }

    // Don't expose encrypted secrets in response
    res.json({
      success: true,
      data: {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        isActive: integration.isActive,
        status: integration.status,
        webhookUrl: integration.webhookUrl,
        config: integration.config,
        lastSyncAt: integration.lastSyncAt,
        lastSyncStatus: integration.lastSyncStatus,
        lastSyncError: integration.lastSyncError,
        hasApiKey: !!integration.apiKey,
        hasApiSecret: !!integration.apiSecret,
        syncHistory: integration.syncHistory,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const configureIntegration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, apiKey, apiSecret, webhookUrl, config, isActive } = req.body;

    if (!type || !['airbnb', 'booking_com'].includes(type)) {
      return next(createError('Invalid integration type', 400));
    }

    // Validate API credentials if provided
    if (apiKey && !apiSecret) {
      return next(createError('API secret is required when API key is provided', 400));
    }

    // Find or create integration
    let integration = await prisma.integration.findUnique({
      where: { type: type as IntegrationType },
    });

    const integrationData: any = {
      name: type === 'airbnb' ? 'Airbnb' : 'Booking.com',
      isActive: isActive ?? false,
      status: apiKey && apiSecret ? IntegrationStatus.configured : IntegrationStatus.not_configured,
      webhookUrl: webhookUrl || null,
      config: config || null,
    };

    if (apiKey) {
      integrationData.apiKey = encrypt(apiKey);
    }
    if (apiSecret) {
      integrationData.apiSecret = encrypt(apiSecret);
    }

    if (integration) {
      integration = await prisma.integration.update({
        where: { id: integration.id },
        data: integrationData,
      });
    } else {
      integration = await prisma.integration.create({
        data: {
          type: type as IntegrationType,
          ...integrationData,
        },
      });
    }

    // Test connection if credentials provided
    if (apiKey && apiSecret) {
      try {
        // This would test the actual API connection
        // For now, we'll just mark as configured
        await prisma.integration.update({
          where: { id: integration.id },
          data: { status: IntegrationStatus.configured },
        });
      } catch (error: any) {
        await prisma.integration.update({
          where: { id: integration.id },
          data: {
            status: IntegrationStatus.error,
            lastSyncError: error.message,
          },
        });
      }
    }

    await auditLog(req.user!.userId, 'update', 'integrations', integration.id, {
      type: integration.type,
      status: integration.status,
    });

    res.json({
      success: true,
      data: {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        isActive: integration.isActive,
        status: integration.status,
        hasApiKey: !!integration.apiKey,
        hasApiSecret: !!integration.apiSecret,
      },
      message: 'Integration configured successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const testIntegration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type } = req.params;

    const integration = await prisma.integration.findUnique({
      where: { type: type as IntegrationType },
    });

    if (!integration || !integration.apiKey || !integration.apiSecret) {
      return next(createError('Integration not configured', 400));
    }

    // Decrypt credentials
    const apiKey = decrypt(integration.apiKey);
    const apiSecret = decrypt(integration.apiSecret);

    // Test connection based on type
    let testResult: { success: boolean; message: string };
    
    if (type === 'airbnb') {
      // Test Airbnb connection
      testResult = await airbnbService.testConnection(apiKey, apiSecret);
    } else if (type === 'booking_com') {
      // Test Booking.com connection
      testResult = await bookingComService.testConnection(apiKey, apiSecret);
    } else {
      return next(createError('Invalid integration type', 400));
    }

    // Update integration status
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        status: testResult.success ? IntegrationStatus.connected : IntegrationStatus.error,
        lastSyncError: testResult.success ? null : testResult.message,
      },
    });

    res.json({
      success: testResult.success,
      message: testResult.message,
    });
  } catch (error: any) {
    next(error);
  }
};


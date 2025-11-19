import { Router } from 'express';
import { body } from 'express-validator';
import {
  syncAirbnb,
  syncBookingCom,
  handleAirbnbWebhook,
  handleBookingComWebhook,
  getIntegrationStatus,
  getIntegration,
  configureIntegration,
  testIntegration,
} from '../controllers/integrations.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/integrations/status:
 *   get:
 *     summary: Get integration status
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integration status retrieved successfully
 */
router.get('/status', authenticate, getIntegrationStatus);
router.get('/:type', authenticate, getIntegration);
router.post('/:type/configure', authenticate, authorize(StaffRole.admin), configureIntegration);
router.post('/:type/test', authenticate, authorize(StaffRole.admin, StaffRole.assistant), testIntegration);

/**
 * @swagger
 * /api/integrations/airbnb/sync:
 *   post:
 *     summary: Sync bookings from Airbnb
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyMapping
 *             properties:
 *               propertyMapping:
 *                 type: object
 *                 description: Mapping of Airbnb listing IDs to local property IDs
 *     responses:
 *       200:
 *         description: Sync completed successfully
 */
router.post(
  '/airbnb/sync',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [body('propertyMapping').isObject()],
  validateRequest,
  syncAirbnb
);

/**
 * @swagger
 * /api/integrations/bookingcom/sync:
 *   post:
 *     summary: Sync bookings from Booking.com
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyMapping
 *             properties:
 *               propertyMapping:
 *                 type: object
 *                 description: Mapping of Booking.com property IDs to local property IDs
 *     responses:
 *       200:
 *         description: Sync completed successfully
 */
router.post(
  '/bookingcom/sync',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [body('propertyMapping').isObject()],
  validateRequest,
  syncBookingCom
);

/**
 * @swagger
 * /api/webhooks/airbnb:
 *   post:
 *     summary: Receive webhook from Airbnb
 *     tags: [Integrations]
 *     description: Public endpoint for Airbnb webhooks (no auth required, but signature verification should be implemented)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
// Webhook endpoints (no auth required, but signature verification should be implemented)
router.post('/airbnb/webhook', handleAirbnbWebhook);
router.post('/bookingcom/webhook', handleBookingComWebhook);

export default router;


import { Router } from 'express';
import { handleAirbnbWebhook, handleBookingComWebhook } from '../controllers/integrations.controller';

const router = Router();

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
router.post('/airbnb', handleAirbnbWebhook);

/**
 * @swagger
 * /api/webhooks/bookingcom:
 *   post:
 *     summary: Receive webhook from Booking.com
 *     tags: [Integrations]
 *     description: Public endpoint for Booking.com webhooks (no auth required, but signature verification should be implemented)
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
router.post('/bookingcom', handleBookingComWebhook);

export default router;


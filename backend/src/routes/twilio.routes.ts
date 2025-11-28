import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authenticate } from '../middleware/auth';
import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import {
  generateToken,
  makeCall,
  receiveCall,
  callStatus,
  recordingStatus,
  getCallHistory,
} from '../controllers/twilio.controller';

const router = Router();

/**
 * @swagger
 * /api/twilio/token:
 *   post:
 *     summary: Generate Twilio Access Token for WebRTC
 *     tags: [Twilio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token generated successfully
 */
router.post('/token', authenticate, generateToken);

/**
 * @swagger
 * /api/twilio/call:
 *   post:
 *     summary: Make an outgoing call
 *     tags: [Twilio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *               from:
 *                 type: string
 *               guestId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Call initiated
 */
router.post(
  '/call',
  authenticate,
  [body('to').isString().notEmpty(), body('from').optional().isString(), body('guestId').optional().isUUID()],
  validateRequest,
  makeCall
);

/**
 * @swagger
 * /api/twilio/incoming:
 *   post:
 *     summary: Handle incoming call (TwiML webhook)
 *     tags: [Twilio]
 *     responses:
 *       200:
 *         description: TwiML response
 */
router.post('/incoming', receiveCall);

/**
 * @swagger
 * /api/twilio/status:
 *   post:
 *     summary: Handle call status updates (TwiML webhook)
 *     tags: [Twilio]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.post('/status', callStatus);

/**
 * @swagger
 * /api/twilio/recording-status:
 *   post:
 *     summary: Handle recording status updates (TwiML webhook)
 *     tags: [Twilio]
 *     responses:
 *       200:
 *         description: Recording status updated
 */
router.post('/recording-status', recordingStatus);

/**
 * @swagger
 * /api/twilio/history:
 *   get:
 *     summary: Get call history
 *     tags: [Twilio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: guestId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Call history retrieved successfully
 */
router.get(
  '/history',
  authenticate,
  [query('guestId').optional().isUUID(), query('limit').optional().isInt(), query('offset').optional().isInt()],
  validateRequest,
  getCallHistory
);

export default router;


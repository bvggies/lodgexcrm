import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  checkIn,
  checkOut,
  getCalendarBookings,
} from '../controllers/bookings.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: guestId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [paid, pending, partial, refunded]
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [airbnb, booking_com, direct, other]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get(
  '/',
  authenticate,
  [
    query('propertyId').optional().isUUID(),
    query('guestId').optional().isUUID(),
    query('status').optional().isIn(['paid', 'pending', 'partial', 'refunded']),
    query('channel').optional().isIn(['airbnb', 'booking_com', 'direct', 'other']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('search').optional().isString(),
  ],
  validateRequest,
  getBookings
);

/**
 * @swagger
 * /api/bookings/calendar:
 *   get:
 *     summary: Get bookings for calendar view
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calendar bookings retrieved successfully
 */
router.get(
  '/calendar',
  authenticate,
  [
    query('start').isISO8601(),
    query('end').isISO8601(),
    query('propertyId').optional().isUUID(),
  ],
  validateRequest,
  getCalendarBookings
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getBooking
);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - guestId
 *               - channel
 *               - checkinDate
 *               - checkoutDate
 *               - totalAmount
 *             properties:
 *               propertyId:
 *                 type: string
 *               unitId:
 *                 type: string
 *               guestId:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [airbnb, booking_com, direct, other]
 *               checkinDate:
 *                 type: string
 *                 format: date-time
 *               checkoutDate:
 *                 type: string
 *                 format: date-time
 *               totalAmount:
 *                 type: number
 *               autoCreateCleaningTask:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       409:
 *         description: Booking conflicts with existing bookings
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    body('propertyId').isUUID(),
    body('guestId').isUUID(),
    body('channel').isIn(['airbnb', 'booking_com', 'direct', 'other']),
    body('checkinDate').isISO8601(),
    body('checkoutDate').isISO8601(),
    body('totalAmount').isFloat({ min: 0 }),
    body('unitId').optional().isUUID(),
    body('currency').optional().isString(),
    body('paymentStatus').optional().isIn(['paid', 'pending', 'partial', 'refunded']),
    body('autoCreateCleaningTask').optional().isBoolean(),
  ],
  validateRequest,
  createBooking
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [param('id').isUUID()],
  validateRequest,
  updateBooking
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  deleteBooking
);

/**
 * @swagger
 * /api/bookings/{id}/checkin:
 *   post:
 *     summary: Mark booking as checked in
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in recorded successfully
 */
router.post(
  '/:id/checkin',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [param('id').isUUID()],
  validateRequest,
  checkIn
);

/**
 * @swagger
 * /api/bookings/{id}/checkout:
 *   post:
 *     summary: Mark booking as checked out
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-out recorded successfully
 */
router.post(
  '/:id/checkout',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [param('id').isUUID()],
  validateRequest,
  checkOut
);

export default router;


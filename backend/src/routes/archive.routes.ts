import { Router } from 'express';
import { param, query } from 'express-validator';
import {
  archiveBooking,
  archiveGuest,
  archiveProperty,
  getArchivedBookings,
  restoreArchivedBooking,
  permanentlyDeleteArchived,
} from '../controllers/archive.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/archive/bookings:
 *   get:
 *     summary: Get archived bookings
 *     tags: [Archive]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archived bookings retrieved successfully
 */
router.get(
  '/bookings',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  getArchivedBookings
);

/**
 * @swagger
 * /api/archive/bookings/{id}:
 *   post:
 *     summary: Archive a booking
 *     tags: [Archive]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking archived successfully
 */
router.post(
  '/bookings/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  archiveBooking
);

/**
 * @swagger
 * /api/archive/bookings/{id}/restore:
 *   post:
 *     summary: Restore an archived booking
 *     tags: [Archive]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking restored successfully
 */
router.post(
  '/bookings/:id/restore',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  restoreArchivedBooking
);

/**
 * @swagger
 * /api/archive/guests/{id}:
 *   post:
 *     summary: Archive a guest
 *     tags: [Archive]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guest archived successfully
 */
router.post(
  '/guests/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  archiveGuest
);

/**
 * @swagger
 * /api/archive/properties/{id}:
 *   post:
 *     summary: Archive a property
 *     tags: [Archive]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Property archived successfully
 */
router.post(
  '/properties/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  archiveProperty
);

/**
 * @swagger
 * /api/archive/{tableName}/{recordId}:
 *   delete:
 *     summary: Permanently delete archived record
 *     tags: [Archive]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Record permanently deleted
 */
router.delete(
  '/:tableName/:recordId',
  authenticate,
  authorize(StaffRole.admin),
  [
    param('tableName').isString(),
    param('recordId').isUUID(),
  ],
  validateRequest,
  permanentlyDeleteArchived
);

export default router;


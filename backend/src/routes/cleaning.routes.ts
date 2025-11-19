import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getCleaningTasks,
  getCleaningTask,
  createCleaningTask,
  updateCleaningTask,
  deleteCleaningTask,
  completeCleaningTask,
  uploadCleaningPhotos,
} from '../controllers/cleaning.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/cleaning:
 *   get:
 *     summary: Get all cleaning tasks
 *     tags: [Cleaning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_started, in_progress, completed]
 *       - in: query
 *         name: cleanerId
 *         schema:
 *           type: string
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
 *         description: Cleaning tasks retrieved successfully
 */
router.get(
  '/',
  authenticate,
  [
    query('propertyId').optional().isUUID(),
    query('status').optional().isIn(['not_started', 'in_progress', 'completed']),
    query('cleanerId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  getCleaningTasks
);

/**
 * @swagger
 * /api/cleaning/{id}:
 *   get:
 *     summary: Get cleaning task by ID
 *     tags: [Cleaning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleaning task retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getCleaningTask
);

/**
 * @swagger
 * /api/cleaning:
 *   post:
 *     summary: Create a new cleaning task
 *     tags: [Cleaning]
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
 *               - scheduledDate
 *             properties:
 *               propertyId:
 *                 type: string
 *               unitId:
 *                 type: string
 *               bookingId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               cleanerId:
 *                 type: string
 *               checklist:
 *                 type: array
 *     responses:
 *       201:
 *         description: Cleaning task created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    body('propertyId').isUUID(),
    body('scheduledDate').isISO8601(),
    body('unitId').optional().isUUID(),
    body('bookingId').optional().isUUID(),
    body('cleanerId').optional().isUUID(),
    body('checklist').optional().isArray(),
  ],
  validateRequest,
  createCleaningTask
);

/**
 * @swagger
 * /api/cleaning/{id}:
 *   put:
 *     summary: Update a cleaning task
 *     tags: [Cleaning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleaning task updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant, StaffRole.cleaner),
  [param('id').isUUID()],
  validateRequest,
  updateCleaningTask
);

/**
 * @swagger
 * /api/cleaning/{id}:
 *   delete:
 *     summary: Delete a cleaning task
 *     tags: [Cleaning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleaning task deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  deleteCleaningTask
);

/**
 * @swagger
 * /api/cleaning/{id}/complete:
 *   post:
 *     summary: Mark cleaning task as completed
 *     tags: [Cleaning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               afterPhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *               cost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cleaning task completed successfully
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant, StaffRole.cleaner),
  [
    param('id').isUUID(),
    body('afterPhotos').optional().isArray(),
    body('notes').optional().isString(),
    body('cost').optional().isFloat({ min: 0 }),
  ],
  validateRequest,
  completeCleaningTask
);

/**
 * @swagger
 * /api/cleaning/{id}/photos:
 *   post:
 *     summary: Upload cleaning task photos
 *     tags: [Cleaning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - photoUrl
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [before, after]
 *               photoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 */
router.post(
  '/:id/photos',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant, StaffRole.cleaner),
  [
    param('id').isUUID(),
    body('type').isIn(['before', 'after']),
    body('photoUrl').isURL(),
  ],
  validateRequest,
  uploadCleaningPhotos
);

export default router;


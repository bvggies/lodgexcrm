import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getMaintenanceTasks,
  getMaintenanceTask,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
  resolveMaintenanceTask,
  uploadMaintenancePhotos,
} from '../controllers/maintenance.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/maintenance:
 *   get:
 *     summary: Get all maintenance tasks
 *     tags: [Maintenance]
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
 *           enum: [open, in_progress, completed]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ac, plumbing, electrical, appliance, other]
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance tasks retrieved successfully
 */
router.get(
  '/',
  authenticate,
  [
    query('propertyId').optional().isUUID(),
    query('status').optional().isIn(['open', 'in_progress', 'completed']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('type').optional().isIn(['ac', 'plumbing', 'electrical', 'appliance', 'other']),
    query('assignedToId').optional().isUUID(),
  ],
  validateRequest,
  getMaintenanceTasks
);

/**
 * @swagger
 * /api/maintenance/{id}:
 *   get:
 *     summary: Get maintenance task by ID
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance task retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getMaintenanceTask
);

/**
 * @swagger
 * /api/maintenance:
 *   post:
 *     summary: Create a new maintenance task
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - propertyId
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               propertyId:
 *                 type: string
 *               unitId:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ac, plumbing, electrical, appliance, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               assignedToId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Maintenance task created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    body('title').trim().notEmpty(),
    body('propertyId').isUUID(),
    body('type').isIn(['ac', 'plumbing', 'electrical', 'appliance', 'other']),
    body('unitId').optional().isUUID(),
    body('description').optional().isString(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('assignedToId').optional().isUUID(),
    body('photos').optional().isArray(),
  ],
  validateRequest,
  createMaintenanceTask
);

/**
 * @swagger
 * /api/maintenance/{id}:
 *   put:
 *     summary: Update a maintenance task
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance task updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant, StaffRole.maintenance),
  [param('id').isUUID()],
  validateRequest,
  updateMaintenanceTask
);

/**
 * @swagger
 * /api/maintenance/{id}:
 *   delete:
 *     summary: Delete a maintenance task
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance task deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  deleteMaintenanceTask
);

/**
 * @swagger
 * /api/maintenance/{id}/resolve:
 *   post:
 *     summary: Resolve a maintenance task
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *               cost:
 *                 type: number
 *               invoiceFile:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance task resolved successfully
 */
router.post(
  '/:id/resolve',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant, StaffRole.maintenance),
  [
    param('id').isUUID(),
    body('photos').optional().isArray(),
    body('cost').optional().isFloat({ min: 0 }),
    body('invoiceFile').optional().isString(),
    body('notes').optional().isString(),
  ],
  validateRequest,
  resolveMaintenanceTask
);

/**
 * @swagger
 * /api/maintenance/{id}/photos:
 *   post:
 *     summary: Upload maintenance task photos
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photoUrl
 *             properties:
 *               photoUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 */
router.post(
  '/:id/photos',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant, StaffRole.maintenance),
  [
    param('id').isUUID(),
    body('photoUrl').isURL(),
  ],
  validateRequest,
  uploadMaintenancePhotos
);

export default router;


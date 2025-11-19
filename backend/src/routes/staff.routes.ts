import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffTasks,
} from '../controllers/staff.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff members
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, assistant, cleaner, maintenance, owner_view]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff members retrieved successfully
 */
router.get(
  '/',
  authenticate,
  [
    query('role').optional().isIn(Object.values(StaffRole)),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString(),
  ],
  validateRequest,
  getStaff
);

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get staff member by ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff member retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getStaffMember
);

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, assistant, cleaner, maintenance, owner_view]
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff member created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin),
  [
    body('name').trim().notEmpty(),
    body('role').isIn(Object.values(StaffRole)),
    body('email').optional().isEmail(),
    body('phone').optional().isString(),
  ],
  validateRequest,
  createStaff
);

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     summary: Update a staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  updateStaff
);

/**
 * @swagger
 * /api/staff/{id}:
 *   delete:
 *     summary: Delete a staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff member deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  deleteStaff
);

/**
 * @swagger
 * /api/staff/{id}/tasks:
 *   get:
 *     summary: Get staff member tasks
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [cleaning, maintenance]
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 */
router.get(
  '/:id/tasks',
  authenticate,
  [
    param('id').isUUID(),
    query('type').optional().isIn(['cleaning', 'maintenance']),
  ],
  validateRequest,
  getStaffTasks
);

export default router;


import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
} from '../controllers/units.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: Get all units
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: availabilityStatus
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Units retrieved successfully
 */
router.get(
  '/',
  authenticate,
  [
    query('propertyId').optional().isUUID(),
    query('availabilityStatus').optional().isString(),
  ],
  validateRequest,
  getUnits
);

/**
 * @swagger
 * /api/units/{id}:
 *   get:
 *     summary: Get unit by ID
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unit retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getUnit
);

/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: Create a new unit
 *     tags: [Units]
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
 *               - unitCode
 *             properties:
 *               propertyId:
 *                 type: string
 *               unitCode:
 *                 type: string
 *               floor:
 *                 type: number
 *               size:
 *                 type: number
 *               currentPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Unit created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    body('propertyId').isUUID(),
    body('unitCode').trim().notEmpty(),
    body('floor').optional().isInt(),
    body('size').optional().isFloat(),
    body('currentPrice').optional().isFloat(),
  ],
  validateRequest,
  createUnit
);

/**
 * @swagger
 * /api/units/{id}:
 *   put:
 *     summary: Update a unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unit updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [param('id').isUUID()],
  validateRequest,
  updateUnit
);

/**
 * @swagger
 * /api/units/{id}:
 *   delete:
 *     summary: Delete a unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unit deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  deleteUnit
);

export default router;


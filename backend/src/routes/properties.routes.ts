import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/properties.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 */
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['active', 'inactive']),
    query('ownerId').optional().isUUID(),
    query('search').optional().isString(),
  ],
  validateRequest,
  getProperties
);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *       404:
 *         description: Property not found
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getProperty
);

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
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
 *               - code
 *               - unitType
 *               - ownerId
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               unitType:
 *                 type: string
 *               address:
 *                 type: object
 *               locationLat:
 *                 type: number
 *               locationLng:
 *                 type: number
 *               ownerId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Property created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    body('name').trim().notEmpty(),
    body('code').trim().notEmpty(),
    body('unitType').trim().notEmpty(),
    body('ownerId').isUUID(),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  validateRequest,
  createProperty
);

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update a property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [param('id').isUUID()],
  validateRequest,
  updateProperty
);

/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Delete a property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  deleteProperty
);

export default router;


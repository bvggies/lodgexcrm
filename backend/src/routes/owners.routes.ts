import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getOwners,
  getOwner,
  createOwner,
  updateOwner,
  deleteOwner,
  getOwnerStatements,
  getMyOwnerData,
  getMyOwnerStatements,
  exportOwnerStatementPDF,
} from '../controllers/owners.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/owners:
 *   get:
 *     summary: Get all owners
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Owners retrieved successfully
 */
router.get(
  '/',
  authenticate,
  [query('search').optional().isString()],
  validateRequest,
  getOwners
);

/**
 * @swagger
 * /api/owners/{id}:
 *   get:
 *     summary: Get owner by ID
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getOwner
);

/**
 * @swagger
 * /api/owners:
 *   post:
 *     summary: Create a new owner
 *     tags: [Owners]
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               bankDetails:
 *                 type: object
 *     responses:
 *       201:
 *         description: Owner created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [body('name').trim().notEmpty()],
  validateRequest,
  createOwner
);

/**
 * @swagger
 * /api/owners/{id}:
 *   put:
 *     summary: Update an owner
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [param('id').isUUID()],
  validateRequest,
  updateOwner
);

/**
 * @swagger
 * /api/owners/{id}:
 *   delete:
 *     summary: Delete an owner
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  deleteOwner
);

/**
 * @swagger
 * /api/owners/me/data:
 *   get:
 *     summary: Get owner's own data (properties, units, bookings, statistics)
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner data retrieved successfully
 */
router.get('/me/data', authenticate, getMyOwnerData);

/**
 * @swagger
 * /api/owners/me/statements:
 *   get:
 *     summary: Get owner's own statements with date range
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: YYYY-MM
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
 *         description: Statements retrieved successfully
 */
router.get(
  '/me/statements',
  authenticate,
  [
    query('month').optional().matches(/^\d{4}-\d{2}$/),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  getMyOwnerStatements
);

/**
 * @swagger
 * /api/owners/{id}/statements:
 *   get:
 *     summary: Get owner statements
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: YYYY-MM
 *     responses:
 *       200:
 *         description: Statements retrieved successfully
 */
router.get(
  '/:id/statements',
  authenticate,
  [
    param('id').isUUID(),
    query('month').optional().matches(/^\d{4}-\d{2}$/),
  ],
  validateRequest,
  getOwnerStatements
);

/**
 * @swagger
 * /api/owners/{id}/statements/pdf:
 *   get:
 *     summary: Export owner statement as PDF
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: YYYY-MM
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
 *         description: PDF file
 */
router.get(
  '/:id/statements/pdf',
  authenticate,
  [
    param('id').isUUID(),
    query('month').optional().matches(/^\d{4}-\d{2}$/),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  exportOwnerStatementPDF
);

/**
 * @swagger
 * /api/owners/me/statements/pdf:
 *   get:
 *     summary: Export owner's own statement as PDF
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: YYYY-MM
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
 *         description: PDF file
 */
router.get(
  '/me/statements/pdf',
  authenticate,
  [
    query('month').optional().matches(/^\d{4}-\d{2}$/),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  exportOwnerStatementPDF
);

export default router;


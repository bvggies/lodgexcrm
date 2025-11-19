import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getGuests,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
  getGuestStayHistory,
} from '../controllers/guests.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/guests:
 *   get:
 *     summary: Get all guests
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: blacklist
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minSpend
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Guests retrieved successfully
 */
router.get(
  '/',
  authenticate,
  [
    query('blacklist').optional().isBoolean(),
    query('search').optional().isString(),
    query('minSpend').optional().isFloat(),
  ],
  validateRequest,
  getGuests
);

/**
 * @swagger
 * /api/guests/{id}:
 *   get:
 *     summary: Get guest by ID
 *     tags: [Guests]
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
 *         description: Guest retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getGuest
);

/**
 * @swagger
 * /api/guests:
 *   post:
 *     summary: Create a new guest
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               nationality:
 *                 type: string
 *     responses:
 *       201:
 *         description: Guest created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().isString(),
  ],
  validateRequest,
  createGuest
);

/**
 * @swagger
 * /api/guests/{id}:
 *   put:
 *     summary: Update a guest
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guest updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [param('id').isUUID()],
  validateRequest,
  updateGuest
);

/**
 * @swagger
 * /api/guests/{id}:
 *   delete:
 *     summary: Delete a guest
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guest deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  deleteGuest
);

/**
 * @swagger
 * /api/guests/{id}/stay-history:
 *   get:
 *     summary: Get guest stay history
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stay history retrieved successfully
 */
router.get(
  '/:id/stay-history',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getGuestStayHistory
);

export default router;


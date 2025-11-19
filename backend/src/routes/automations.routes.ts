import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  triggerAutomation,
} from '../controllers/automations.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/automations:
 *   get:
 *     summary: Get all automations
 *     tags: [Automations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Automations retrieved successfully
 */
router.get('/', authenticate, getAutomations);
router.get('/:id', authenticate, getAutomation);

/**
 * @swagger
 * /api/automations:
 *   post:
 *     summary: Create a new automation
 *     tags: [Automations]
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
 *               - trigger
 *               - actions
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               trigger:
 *                 type: string
 *               conditions:
 *                 type: object
 *               actions:
 *                 type: array
 *               enabled:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Automation created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin),
  [
    body('name').trim().notEmpty(),
    body('trigger').isString(),
    body('actions').isArray(),
  ],
  validateRequest,
  createAutomation
);

/**
 * @swagger
 * /api/automations/{id}:
 *   put:
 *     summary: Update an automation
 *     tags: [Automations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Automation updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isString()],
  validateRequest,
  updateAutomation
);

/**
 * @swagger
 * /api/automations/{id}:
 *   delete:
 *     summary: Delete an automation
 *     tags: [Automations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Automation deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isString()],
  validateRequest,
  deleteAutomation
);

/**
 * @swagger
 * /api/automations/trigger:
 *   post:
 *     summary: Manually trigger an automation
 *     tags: [Automations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trigger
 *             properties:
 *               trigger:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Automation triggered successfully
 */
router.post(
  '/trigger',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [body('trigger').isString()],
  validateRequest,
  triggerAutomation
);

export default router;


import { Router } from 'express';
import { param, query } from 'express-validator';
import {
  getAuditLogs,
  getAuditLog,
  getRecordHistory,
} from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tableName
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, update, delete]
 *       - in: query
 *         name: recordId
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */
router.get(
  '/',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    query('userId').optional().isUUID(),
    query('tableName').optional().isString(),
    query('action').optional().isIn(['create', 'update', 'delete']),
    query('recordId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  getAuditLogs
);

/**
 * @swagger
 * /api/audit/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [param('id').isUUID()],
  validateRequest,
  getAuditLog
);

/**
 * @swagger
 * /api/audit/history/{tableName}/{recordId}:
 *   get:
 *     summary: Get change history for a specific record
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Record history retrieved successfully
 */
router.get(
  '/history/:tableName/:recordId',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    param('tableName').isString(),
    param('recordId').isUUID(),
  ],
  validateRequest,
  getRecordHistory
);

export default router;


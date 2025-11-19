import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import {
  getFinanceRecords,
  getFinanceRecord,
  createFinanceRecord,
  updateFinanceRecord,
  deleteFinanceRecord,
  getMonthlyReport,
  exportFinanceRecordsCSV,
  exportFinanceRecordsPDF,
} from '../controllers/finance.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/finance:
 *   get:
 *     summary: Get all finance records
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [revenue, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [paid, pending]
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
 *         description: Finance records retrieved successfully
 */
router.get(
  '/',
  authenticate,
  [
    query('propertyId').optional().isUUID(),
    query('bookingId').optional().isUUID(),
    query('type').optional().isIn(['revenue', 'expense']),
    query('category').optional().isString(),
    query('status').optional().isIn(['paid', 'pending']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  getFinanceRecords
);

/**
 * @swagger
 * /api/finance/reports/monthly:
 *   get:
 *     summary: Get monthly finance report
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: YYYY-MM
 *     responses:
 *       200:
 *         description: Monthly report retrieved successfully
 */
router.get(
  '/reports/monthly',
  authenticate,
  [
    query('propertyId').optional().isUUID(),
    query('month').optional().matches(/^\d{4}-\d{2}$/),
  ],
  validateRequest,
  getMonthlyReport
);

/**
 * @swagger
 * /api/finance/export:
 *   get:
 *     summary: Export finance records
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *       - in: query
 *         name: propertyId
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
 *         name: month
 *         schema:
 *           type: string
 *           format: YYYY-MM
 *     responses:
 *       200:
 *         description: Export file generated successfully
 */
router.get(
  '/export',
  authenticate,
  [
    query('format').isIn(['csv', 'pdf']),
    query('propertyId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('month').optional().matches(/^\d{4}-\d{2}$/),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { format } = req.query;
    if (format === 'csv') {
      return exportFinanceRecordsCSV(req, res, next);
    } else {
      return exportFinanceRecordsPDF(req, res, next);
    }
  }
);

/**
 * @swagger
 * /api/finance/{id}:
 *   get:
 *     summary: Get finance record by ID
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finance record retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  getFinanceRecord
);

/**
 * @swagger
 * /api/finance:
 *   post:
 *     summary: Create a new finance record
 *     tags: [Finance]
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
 *               - amount
 *               - category
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [revenue, expense]
 *               propertyId:
 *                 type: string
 *               bookingId:
 *                 type: string
 *               guestId:
 *                 type: string
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Finance record created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [
    body('type').isIn(['revenue', 'expense']),
    body('amount').isFloat({ min: 0 }),
    body('category').isString(),
    body('propertyId').optional().isUUID(),
    body('bookingId').optional().isUUID(),
    body('guestId').optional().isUUID(),
    body('date').optional().isISO8601(),
    body('paymentMethod').optional().isString(),
    body('status').optional().isIn(['paid', 'pending']),
  ],
  validateRequest,
  createFinanceRecord
);

/**
 * @swagger
 * /api/finance/{id}:
 *   put:
 *     summary: Update a finance record
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finance record updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(StaffRole.admin, StaffRole.assistant),
  [param('id').isUUID()],
  validateRequest,
  updateFinanceRecord
);

/**
 * @swagger
 * /api/finance/{id}:
 *   delete:
 *     summary: Delete a finance record
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finance record deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(StaffRole.admin),
  [param('id').isUUID()],
  validateRequest,
  deleteFinanceRecord
);

export default router;


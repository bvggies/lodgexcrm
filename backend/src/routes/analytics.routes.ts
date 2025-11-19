import { Router } from 'express';
import { param, query } from 'express-validator';
import {
  getDashboardSummary,
  getPropertyAnalytics,
  getRevenueExpenseChart,
  getOccupancyRates,
  getRepeatGuestsAnalysis,
  exportAnalytics,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 */
router.get(
  '/summary',
  authenticate,
  validateRequest,
  getDashboardSummary
);

/**
 * @swagger
 * /api/analytics/property/{id}:
 *   get:
 *     summary: Get property-specific analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *         description: Property analytics retrieved successfully
 */
router.get(
  '/property/:id',
  authenticate,
  [
    param('id').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  getPropertyAnalytics
);

/**
 * @swagger
 * /api/analytics/revenue-expense:
 *   get:
 *     summary: Get revenue vs expense chart data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: propertyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 */
router.get(
  '/revenue-expense',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('propertyId').optional().isUUID(),
  ],
  validateRequest,
  getRevenueExpenseChart
);

/**
 * @swagger
 * /api/analytics/occupancy:
 *   get:
 *     summary: Get occupancy rates
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Occupancy rates retrieved successfully
 */
router.get(
  '/occupancy',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  getOccupancyRates
);

/**
 * @swagger
 * /api/analytics/repeat-guests:
 *   get:
 *     summary: Get repeat guests analysis
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Repeat guests analysis retrieved successfully
 */
router.get(
  '/repeat-guests',
  authenticate,
  validateRequest,
  getRepeatGuestsAnalysis
);

/**
 * @swagger
 * /api/analytics/export:
 *   get:
 *     summary: Export analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *     responses:
 *       200:
 *         description: Analytics data exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/export',
  authenticate,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('format').optional().isIn(['csv', 'pdf']),
  ],
  validateRequest,
  exportAnalytics
);

export default router;


import { Router } from 'express';
import multer from 'multer';
import { downloadTemplate, importData } from '../controllers/import.controller';
import { authenticate, authorize } from '../middleware/auth';
import { StaffRole } from '@prisma/client';
import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Configure multer for Excel files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

/**
 * @swagger
 * /api/import/template:
 *   get:
 *     summary: Download Excel template for data import
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [properties, guests, bookings, finance, owners, staff]
 *     responses:
 *       200:
 *         description: Excel template file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/template',
  authenticate,
  authorize(StaffRole.admin),
  [
    query('type')
      .isIn(['properties', 'guests', 'bookings', 'finance', 'owners', 'staff'])
      .withMessage('Invalid template type'),
  ],
  validateRequest,
  downloadTemplate
);

/**
 * @swagger
 * /api/import:
 *   post:
 *     summary: Import data from Excel file
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - type
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [properties, guests, bookings, finance, owners, staff]
 *     responses:
 *       200:
 *         description: Import result
 */
router.post(
  '/',
  authenticate,
  authorize(StaffRole.admin),
  upload.single('file'),
  [
    body('type')
      .isIn(['properties', 'guests', 'bookings', 'finance', 'owners', 'staff'])
      .withMessage('Invalid import type'),
  ],
  validateRequest,
  importData
);

export default router;


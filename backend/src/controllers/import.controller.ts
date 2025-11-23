import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { excelImportService } from '../services/excelImport.service';
import * as XLSX from 'xlsx';

/**
 * Generate Excel template for data import
 */
export const downloadTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      return next(createError('Template type is required', 400));
    }

    const workbook = XLSX.utils.book_new();

    switch (type) {
      case 'properties':
        {
          const data = [
            {
              name: 'Example Property',
              code: 'PROP-001',
              unitType: 'apartment',
              address: '{"street":"123 Main St","city":"Dubai","country":"UAE"}',
              latitude: '25.2048',
              longitude: '55.2708',
              ownerEmail: 'owner@example.com',
              ownerName: 'John Owner',
              ownerPhone: '+971501234567',
              status: 'active',
              dewaNumber: 'DEWA123456',
              dtcmPermitNumber: 'DTCM789',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, ws, 'Properties');
        }
        break;

      case 'guests':
        {
          const data = [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              phone: '+971501234567',
              nationality: 'US',
              dateOfBirth: '1990-01-01',
              idNumber: '123456789',
              passportNumber: 'AB123456',
              address: '{"street":"456 Guest St","city":"Dubai"}',
              isVip: 'No',
              notes: 'Regular guest',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, ws, 'Guests');
        }
        break;

      case 'bookings':
        {
          const data = [
            {
              propertyCode: 'PROP-001',
              unitCode: 'UNIT-101',
              guestEmail: 'john.doe@example.com',
              guestFirstName: 'John',
              guestLastName: 'Doe',
              guestPhone: '+971501234567',
              checkinDate: '2024-01-01',
              checkoutDate: '2024-01-05',
              totalAmount: '5000',
              currency: 'AED',
              paymentStatus: 'paid',
              depositAmount: '1000',
              channel: 'direct',
              status: 'confirmed',
              reference: 'BK-2024-001',
              notes: 'Early check-in requested',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, ws, 'Bookings');
        }
        break;

      case 'finance':
        {
          const data = [
            {
              type: 'revenue',
              category: 'booking',
              amount: '5000',
              date: '2024-01-01',
              propertyCode: 'PROP-001',
              paymentMethod: 'card',
              status: 'completed',
              description: 'Booking payment',
            },
            {
              type: 'expense',
              category: 'cleaning',
              amount: '200',
              date: '2024-01-02',
              propertyCode: 'PROP-001',
              paymentMethod: 'cash',
              status: 'completed',
              description: 'Cleaning service',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, ws, 'Finance Records');
        }
        break;

      case 'owners':
        {
          const data = [
            {
              name: 'John Owner',
              email: 'owner@example.com',
              phone: '+971501234567',
              address: '{"street":"789 Owner Ave","city":"Dubai"}',
              taxId: 'TAX123456',
              bankAccount: '{"bank":"Emirates NBD","account":"1234567890"}',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, ws, 'Owners');
        }
        break;

      case 'staff':
        {
          const data = [
            {
              name: 'Jane Staff',
              email: 'staff@example.com',
              role: 'assistant',
              password: 'password123',
              isActive: 'Yes',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, ws, 'Staff');
        }
        break;

      default:
        return next(createError(`Unknown template type: ${type}`, 400));
    }

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="lodgexcrm-${type}-template.xlsx"`);

    res.send(excelBuffer);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Import data from Excel file
 */
export const importData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next(createError('No file uploaded', 400));
    }

    const { type, isHistoricalData, historicalYear } = req.body;

    if (!type) {
      return next(createError('Import type is required', 400));
    }

    // Parse Excel file
    const workbook = excelImportService.parseExcelFile(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const data = excelImportService.getSheetData(workbook, sheetName);

    if (data.length === 0) {
      return next(createError('Excel file is empty', 400));
    }

    // Prepare import options
    const importOptions = {
      isHistoricalData: isHistoricalData === 'true' || isHistoricalData === true,
      historicalYear: historicalYear ? parseInt(historicalYear, 10) : undefined,
    };

    let result;

    switch (type) {
      case 'properties':
        result = await excelImportService.importProperties(data, importOptions);
        break;
      case 'guests':
        result = await excelImportService.importGuests(data, importOptions);
        break;
      case 'bookings':
        result = await excelImportService.importBookings(data, importOptions);
        break;
      case 'finance':
        result = await excelImportService.importFinanceRecords(data, importOptions);
        break;
      case 'owners':
        result = await excelImportService.importOwners(data, importOptions);
        break;
      case 'staff':
        result = await excelImportService.importStaff(data, importOptions);
        break;
      default:
        return next(createError(`Unknown import type: ${type}`, 400));
    }

    res.json({
      success: true,
      data: {
        imported: result.success,
        failed: result.failed,
        total: data.length,
        errors: result.errors.slice(0, 50), // Limit to first 50 errors
        warnings: result.warnings.slice(0, 50), // Limit to first 50 warnings
      },
    });
  } catch (error: any) {
    next(error);
  }
};


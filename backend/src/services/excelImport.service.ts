import * as XLSX from 'xlsx';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { hashPassword } from '../utils/auth';
import { differenceInDays } from 'date-fns';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

export class ExcelImportService {
  /**
   * Parse Excel file and return data
   */
  parseExcelFile(buffer: Buffer): XLSX.WorkBook {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      return workbook;
    } catch (error: any) {
      throw createError(`Failed to parse Excel file: ${error.message}`, 400);
    }
  }

  /**
   * Get sheet data as JSON
   */
  getSheetData(workbook: XLSX.WorkBook, sheetName: string): any[] {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw createError(`Sheet "${sheetName}" not found in Excel file`, 400);
    }
    return XLSX.utils.sheet_to_json(sheet);
  }

  /**
   * Import Properties from Excel
   */
  async importProperties(data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      try {
        // Validate required fields
        if (!row.name || !row.code) {
          result.failed++;
          result.errors.push(`Row ${rowNum}: Missing required fields (name, code)`);
          continue;
        }

        // Check if property already exists
        const existing = await prisma.property.findFirst({
          where: { code: row.code },
        });

        if (existing) {
          result.warnings.push(`Row ${rowNum}: Property with code "${row.code}" already exists, skipping`);
          continue;
        }

        // Get or create owner
        let ownerId = row.ownerId;
        if (row.ownerEmail && !ownerId) {
          let owner = await prisma.owner.findFirst({
            where: { email: row.ownerEmail },
          });

          if (!owner) {
            owner = await prisma.owner.create({
              data: {
                name: row.ownerName || 'Unknown Owner',
                email: row.ownerEmail,
                phone: row.ownerPhone || '',
              },
            });
          }
          ownerId = owner.id;
        }

        if (!ownerId) {
          result.failed++;
          result.errors.push(`Row ${rowNum}: Owner ID or email required`);
          continue;
        }

        // Create property
        await prisma.property.create({
          data: {
            name: row.name,
            code: row.code,
            unitType: row.unitType || 'apartment',
            address: row.address ? JSON.parse(row.address) : {},
            locationLat: row.latitude ? parseFloat(row.latitude) : undefined,
            locationLng: row.longitude ? parseFloat(row.longitude) : undefined,
            ownerId,
            status: row.status || 'active',
            dewaNumber: row.dewaNumber || undefined,
            dtcmPermitNumber: row.dtcmPermitNumber || undefined,
            amenities: row.amenities ? JSON.parse(row.amenities) : {},
          },
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Import Guests from Excel
   */
  async importGuests(data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        if (!row.firstName || !row.lastName || !row.email) {
          result.failed++;
          result.errors.push(`Row ${rowNum}: Missing required fields (firstName, lastName, email)`);
          continue;
        }

        // Check if guest already exists
        const existing = await prisma.guest.findFirst({
          where: { email: row.email },
        });

        if (existing) {
          result.warnings.push(`Row ${rowNum}: Guest with email "${row.email}" already exists, skipping`);
          continue;
        }

        await prisma.guest.create({
          data: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone || '',
            nationality: row.nationality || undefined,
            passportScanUrl: row.passportNumber ? undefined : undefined, // Store in documents if needed
            documents: row.idNumber || row.passportNumber ? {
              idNumber: row.idNumber,
              passportNumber: row.passportNumber,
            } : undefined,
            notes: row.notes || undefined,
            isVip: row.isVip === 'Yes' || row.isVip === true || row.isVip === 'true',
          },
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Import Bookings from Excel
   */
  async importBookings(data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        if (!row.propertyCode || !row.guestEmail || !row.checkinDate || !row.checkoutDate) {
          result.failed++;
          result.errors.push(`Row ${rowNum}: Missing required fields`);
          continue;
        }

        // Find property
        const property = await prisma.property.findFirst({
          where: { code: row.propertyCode },
        });

        if (!property) {
          result.failed++;
          result.errors.push(`Row ${rowNum}: Property with code "${row.propertyCode}" not found`);
          continue;
        }

        // Find guest
        let guest = await prisma.guest.findFirst({
          where: { email: row.guestEmail },
        });

        if (!guest) {
          // Create guest if doesn't exist
          guest = await prisma.guest.create({
            data: {
              firstName: row.guestFirstName || 'Unknown',
              lastName: row.guestLastName || 'Guest',
              email: row.guestEmail,
              phone: row.guestPhone || '',
            },
          });
        }

        // Find unit if specified
        let unitId = undefined;
        if (row.unitCode) {
          const unit = await prisma.unit.findFirst({
            where: {
              unitCode: row.unitCode,
              propertyId: property.id,
            },
          });
          unitId = unit?.id;
        }

        // Parse dates
        const checkinDate = new Date(row.checkinDate);
        const checkoutDate = new Date(row.checkoutDate);

        // Calculate nights
        const nights = differenceInDays(checkoutDate, checkinDate);

        await prisma.booking.create({
          data: {
            propertyId: property.id,
            unitId,
            guestId: guest.id,
            reference: row.reference || `BK-${Date.now()}-${i}`,
            checkinDate,
            checkoutDate,
            nights,
            totalAmount: parseFloat(row.totalAmount || '0'),
            currency: row.currency || 'AED',
            paymentStatus: row.paymentStatus || 'pending',
            depositAmount: row.depositAmount ? parseFloat(row.depositAmount) : undefined,
            channel: row.channel || 'direct',
            notes: row.notes || undefined,
          },
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Import Finance Records from Excel
   */
  async importFinanceRecords(data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        if (!row.type || !row.amount || !row.date) {
          result.failed++;
          result.errors.push(`Row ${rowNum}: Missing required fields (type, amount, date)`);
          continue;
        }

        let propertyId = undefined;
        if (row.propertyCode) {
          const property = await prisma.property.findFirst({
            where: { code: row.propertyCode },
          });
          propertyId = property?.id;
        }

        await prisma.financeRecord.create({
          data: {
            type: row.type,
            category: row.category || 'other',
            amount: parseFloat(row.amount),
            date: new Date(row.date),
            propertyId,
            paymentMethod: row.paymentMethod || 'cash',
            status: row.status || 'completed',
          },
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Import Owners from Excel
   */
  async importOwners(data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        if (!row.name || !row.email) {
          result.failed++;
          result.errors.push(`Row ${rowNum}: Missing required fields (name, email)`);
          continue;
        }

        const existing = await prisma.owner.findFirst({
          where: { email: row.email },
        });

        if (existing) {
          result.warnings.push(`Row ${rowNum}: Owner with email "${row.email}" already exists, skipping`);
          continue;
        }

        await prisma.owner.create({
          data: {
            name: row.name,
            email: row.email,
            phone: row.phone || '',
            idDocuments: row.taxId ? { taxId: row.taxId } : undefined,
            bankDetails: row.bankAccount ? JSON.stringify(JSON.parse(row.bankAccount)) : undefined,
          },
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Import Staff from Excel
   */
  async importStaff(data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        if (!row.name || !row.email || !row.role) {
          result.failed++;
          result.errors.push(`Row ${rowNum}: Missing required fields (name, email, role)`);
          continue;
        }

        const existing = await prisma.user.findFirst({
          where: { email: row.email },
        });

        if (existing) {
          result.warnings.push(`Row ${rowNum}: Staff with email "${row.email}" already exists, skipping`);
          continue;
        }

        const passwordHash = await hashPassword(row.password || 'password123');

        await prisma.user.create({
          data: {
            email: row.email,
            passwordHash,
            firstName: row.name.split(' ')[0] || row.name,
            lastName: row.name.split(' ').slice(1).join(' ') || '',
            role: row.role,
            isActive: row.isActive !== 'No' && row.isActive !== false,
          },
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return result;
  }
}

export const excelImportService = new ExcelImportService();


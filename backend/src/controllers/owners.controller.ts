import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';

// Simple encryption/decryption for bank details
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export const getOwners = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const owners = await prisma.owner.findMany({
      where,
      include: {
        _count: {
          select: {
            properties: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { owners },
      count: owners.length,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        properties: {
          include: {
            _count: {
              select: {
                bookings: true,
                units: true,
              },
            },
          },
        },
      },
    });

    if (!owner) {
      return next(createError('Owner not found', 404));
    }

    // Decrypt bank details if present
    const ownerData: any = { ...owner };
    if (owner.bankDetails) {
      try {
        ownerData.bankDetails = JSON.parse(decrypt(owner.bankDetails));
      } catch (e) {
        // If decryption fails, return as is (might be unencrypted legacy data)
        ownerData.bankDetails = owner.bankDetails;
      }
    }

    res.json({
      success: true,
      data: { owner: ownerData },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const {
      name,
      email,
      phone,
      bankDetails,
      paymentMethod,
      idDocuments,
      notes,
    } = req.body;

    // Encrypt bank details if provided
    let encryptedBankDetails = null;
    if (bankDetails) {
      encryptedBankDetails = encrypt(JSON.stringify(bankDetails));
    }

    const owner = await prisma.owner.create({
      data: {
        name,
        email,
        phone,
        bankDetails: encryptedBankDetails,
        paymentMethod,
        idDocuments: idDocuments || [],
        notes,
      },
    });

    // Audit log
    await auditLog('create', 'owners', owner.id, req.user.userId, {
      name: owner.name,
      email: owner.email,
    });

    // Don't return encrypted bank details
    const ownerData: any = { ...owner };
    ownerData.bankDetails = bankDetails || null;

    res.status(201).json({
      success: true,
      data: { owner: ownerData },
      message: 'Owner created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const {
      name,
      email,
      phone,
      bankDetails,
      paymentMethod,
      idDocuments,
      notes,
    } = req.body;

    const existingOwner = await prisma.owner.findUnique({
      where: { id },
    });

    if (!existingOwner) {
      return next(createError('Owner not found', 404));
    }

    // Encrypt bank details if provided
    let encryptedBankDetails = existingOwner.bankDetails;
    if (bankDetails !== undefined) {
      if (bankDetails) {
        encryptedBankDetails = encrypt(JSON.stringify(bankDetails));
      } else {
        encryptedBankDetails = null;
      }
    }

    const owner = await prisma.owner.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        bankDetails: encryptedBankDetails,
        paymentMethod,
        idDocuments,
        notes,
      },
    });

    // Audit log
    await auditLog('update', 'owners', owner.id, req.user.userId, {
      name: owner.name,
      email: owner.email,
    });

    // Don't return encrypted bank details
    const ownerData: any = { ...owner };
    ownerData.bankDetails = bankDetails !== undefined ? bankDetails : existingOwner.bankDetails;

    res.json({
      success: true,
      data: { owner: ownerData },
      message: 'Owner updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    const owner = await prisma.owner.findUnique({
      where: { id },
    });

    if (!owner) {
      return next(createError('Owner not found', 404));
    }

    await prisma.owner.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'owners', id, req.user.userId, {
      name: owner.name,
    });

    res.json({
      success: true,
      message: 'Owner deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const getOwnerStatements = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { month } = req.query; // Format: YYYY-MM

    const owner = await prisma.owner.findUnique({
      where: { id },
    });

    if (!owner) {
      return next(createError('Owner not found', 404));
    }

    // Parse month if provided
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = (month as string).split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0, 23, 59, 59);
    } else {
      // Current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Get properties for this owner
    const properties = await prisma.property.findMany({
      where: { ownerId: id },
      select: { id: true },
    });

    const propertyIds = properties.map((p) => p.id);

    // Get finance records for owner's properties
    const financeRecords = await prisma.financeRecord.findMany({
      where: {
        propertyId: { in: propertyIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        booking: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate totals
    const revenue = financeRecords
      .filter((r) => r.type === 'revenue')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const expenses = financeRecords
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const netIncome = revenue - expenses;

    res.json({
      success: true,
      data: {
        owner: {
          id: owner.id,
          name: owner.name,
        },
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: {
          revenue,
          expenses,
          netIncome,
        },
        records: financeRecords,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get owner's own data (for owner_view role)
export const getMyOwnerData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    // Find owner by user email
    const owner = await prisma.owner.findFirst({
      where: { email: req.user.email },
    });

    if (!owner) {
      return next(createError('Owner record not found for this user', 404));
    }

    // Get properties
    const properties = await prisma.property.findMany({
      where: { ownerId: owner.id },
      include: {
        units: true,
        _count: {
          select: {
            bookings: true,
            units: true,
          },
        },
      },
    });

    // Get all units
    const propertyIds = properties.map((p) => p.id);
    const units = await prisma.unit.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Get bookings
    const now = new Date();
    const bookings = await prisma.booking.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitCode: true,
          },
        },
      },
      orderBy: {
        checkinDate: 'desc',
      },
    });

    // Calculate statistics
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(
      (b) => b.paymentStatus === 'pending' && new Date(b.checkinDate) > now
    ).length;
    const upcomingBookings = bookings.filter(
      (b) => new Date(b.checkinDate) > now && new Date(b.checkinDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    ).length;
    const currentBookings = bookings.filter(
      (b) => new Date(b.checkinDate) <= now && new Date(b.checkoutDate) > now
    ).length;

    // Calculate occupancy rate (for current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const monthBookings = bookings.filter(
      (b) => new Date(b.checkinDate) <= monthEnd && new Date(b.checkoutDate) >= monthStart
    );
    const totalNights = monthBookings.reduce((sum, b) => {
      const checkin = new Date(b.checkinDate);
      const checkout = new Date(b.checkoutDate);
      const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
      return sum + nights;
    }, 0);
    const totalAvailableNights = units.length * monthEnd.getDate();
    const occupancyRate = totalAvailableNights > 0 ? (totalNights / totalAvailableNights) * 100 : 0;

    // Calculate revenue (current month)
    const financeRecords = await prisma.financeRecord.findMany({
      where: {
        propertyId: { in: propertyIds },
        type: 'revenue',
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });
    const revenue = financeRecords.reduce((sum, r) => sum + Number(r.amount), 0);

    res.json({
      success: true,
      data: {
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
        },
        properties,
        units,
        bookings,
        statistics: {
          totalProperties: properties.length,
          totalUnits: units.length,
          totalBookings,
          pendingBookings,
          upcomingBookings,
          currentBookings,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          monthlyRevenue: revenue,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get owner's own statements with date range
export const getMyOwnerStatements = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    // Find owner by user email
    const owner = await prisma.owner.findFirst({
      where: { email: req.user.email },
    });

    if (!owner) {
      return next(createError('Owner record not found for this user', 404));
    }

    const { month, startDate, endDate } = req.query;

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    } else if (month) {
      const [year, monthNum] = (month as string).split('-').map(Number);
      start = new Date(year, monthNum - 1, 1);
      end = new Date(year, monthNum, 0, 23, 59, 59);
    } else {
      // Current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Get properties for this owner
    const properties = await prisma.property.findMany({
      where: { ownerId: owner.id },
      select: { id: true },
    });

    const propertyIds = properties.map((p) => p.id);

    // Get finance records
    const financeRecords = await prisma.financeRecord.findMany({
      where: {
        propertyId: { in: propertyIds },
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        booking: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate totals
    const revenue = financeRecords
      .filter((r) => r.type === 'revenue')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const expenses = financeRecords
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const netIncome = revenue - expenses;

    res.json({
      success: true,
      data: {
        owner: {
          id: owner.id,
          name: owner.name,
        },
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        summary: {
          revenue,
          expenses,
          netIncome,
        },
        records: financeRecords,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Export owner statement as PDF
export const exportOwnerStatementPDF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { month, startDate, endDate } = req.query;
    let owner;

    // Check if this is for a specific owner (admin) or current user (owner_view)
    if (req.params.id) {
      owner = await prisma.owner.findUnique({
        where: { id: req.params.id },
      });
      if (!owner) {
        return next(createError('Owner not found', 404));
      }
    } else {
      // For owner_view role, find owner by email
      owner = await prisma.owner.findFirst({
        where: { email: req.user.email },
      });
      if (!owner) {
        return next(createError('Owner record not found for this user', 404));
      }
    }

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    } else if (month) {
      const [year, monthNum] = (month as string).split('-').map(Number);
      start = new Date(year, monthNum - 1, 1);
      end = new Date(year, monthNum, 0, 23, 59, 59);
    } else {
      // Current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Get properties for this owner
    const properties = await prisma.property.findMany({
      where: { ownerId: owner.id },
      select: { id: true },
    });

    const propertyIds = properties.map((p) => p.id);

    // Get finance records
    const financeRecords = await prisma.financeRecord.findMany({
      where: {
        propertyId: { in: propertyIds },
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        booking: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate totals
    const revenue = financeRecords
      .filter((r) => r.type === 'revenue')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const expenses = financeRecords
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const netIncome = revenue - expenses;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 750;
    const margin = 50;
    const lineHeight = 20;

    // Try to load logo
    try {
      const logoPath = path.join(process.cwd(), 'frontend', 'public', 'chlogo.png');
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        // Try PNG first, then JPG
        let logoImage;
        try {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } catch {
          try {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          } catch {
            console.warn('Logo is not a valid PNG or JPG');
          }
        }
        if (logoImage) {
          const logoDims = logoImage.scale(0.15); // Scale down logo
          page.drawImage(logoImage, {
            x: margin,
            y: y - 30,
            width: logoDims.width,
            height: logoDims.height,
          });
        }
      }
    } catch (error) {
      console.warn('Could not load logo:', error);
    }

    // Company name and contact info
    const companyName = 'Creative Homes Vacation Rental LLC';
    const companyPhone = process.env.COMPANY_PHONE || '+971 4 XXX XXXX';
    const companyAddress = process.env.COMPANY_ADDRESS || 'Dubai, United Arab Emirates';

    // Company name (right-aligned)
    const companyNameWidth = boldFont.widthOfTextAtSize(companyName, 18);
    page.drawText(companyName, {
      x: 612 - margin - companyNameWidth,
      y: y,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= 25;

    // Phone and address (right-aligned)
    const phoneWidth = font.widthOfTextAtSize(companyPhone, 10);
    page.drawText(companyPhone, {
      x: 612 - margin - phoneWidth,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 15;

    const addressWidth = font.widthOfTextAtSize(companyAddress, 10);
    page.drawText(companyAddress, {
      x: 612 - margin - addressWidth,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 50;

    // Draw a line separator
    page.drawLine({
      start: { x: margin, y },
      end: { x: 562, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 30;

    // Title
    page.drawText('Financial Statement', {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= 30;

    // Owner name
    page.drawText(`Owner: ${owner.name}`, {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= 25;

    // Period
    page.drawText(
      `Period: ${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`,
      {
        x: margin,
        y,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.4),
      }
    );

    y -= 30;

    // Summary section
    page.drawText('Summary', {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= lineHeight + 5;
    page.drawText(`Total Revenue: AED ${revenue.toFixed(2)}`, {
      x: margin + 20,
      y,
      size: 12,
      font,
      color: rgb(0, 0.5, 0),
    });

    y -= lineHeight;
    page.drawText(`Total Expenses: AED ${expenses.toFixed(2)}`, {
      x: margin + 20,
      y,
      size: 12,
      font,
      color: rgb(0.8, 0, 0),
    });

    y -= lineHeight;
    page.drawText(`Net Income: AED ${netIncome.toFixed(2)}`, {
      x: margin + 20,
      y,
      size: 14,
      font: boldFont,
      color: netIncome >= 0 ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0),
    });

    y -= 30;

    // Records table header
    const tableY = y;
    page.drawLine({
      start: { x: margin, y },
      end: { x: 562, y },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    y -= 5;
    page.drawText('Date', { x: margin, y, size: 10, font: boldFont });
    page.drawText('Type', { x: margin + 80, y, size: 10, font: boldFont });
    page.drawText('Property', { x: margin + 140, y, size: 10, font: boldFont });
    page.drawText('Description', { x: margin + 250, y, size: 10, font: boldFont });
    page.drawText('Amount', { x: margin + 450, y, size: 10, font: boldFont });

    y -= 5;
    page.drawLine({
      start: { x: margin, y },
      end: { x: 562, y },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    y -= 15;

    // Records
    let currentPage = page;
    financeRecords.forEach((record) => {
      if (y < 100) {
        // New page if needed
        currentPage = pdfDoc.addPage([612, 792]);
        y = 750;

        // Add header to new page
        currentPage.drawText('Financial Statement (continued)', {
          x: margin,
          y,
          size: 16,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 30;

        // Table header on new page
        currentPage.drawLine({
          start: { x: margin, y },
          end: { x: 562, y },
          thickness: 1,
          color: rgb(0.6, 0.6, 0.6),
        });
        y -= 5;
        currentPage.drawText('Date', { x: margin, y, size: 10, font: boldFont });
        currentPage.drawText('Type', { x: margin + 80, y, size: 10, font: boldFont });
        currentPage.drawText('Property', { x: margin + 140, y, size: 10, font: boldFont });
        currentPage.drawText('Description', { x: margin + 250, y, size: 10, font: boldFont });
        currentPage.drawText('Amount', { x: margin + 450, y, size: 10, font: boldFont });
        y -= 5;
        currentPage.drawLine({
          start: { x: margin, y },
          end: { x: 562, y },
          thickness: 1,
          color: rgb(0.6, 0.6, 0.6),
        });
        y -= 15;
      }

      currentPage.drawText(format(new Date(record.date), 'MM/dd/yyyy'), {
        x: margin,
        y,
        size: 9,
        font,
      });
      currentPage.drawText(record.type.toUpperCase(), {
        x: margin + 80,
        y,
        size: 9,
        font,
        color: record.type === 'revenue' ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0),
      });
      currentPage.drawText((record.property?.name || 'N/A').substring(0, 15), {
        x: margin + 140,
        y,
        size: 9,
        font,
      });
      const description = (record as any).description || record.booking?.reference || '-';
      currentPage.drawText(description.substring(0, 20), {
        x: margin + 250,
        y,
        size: 9,
        font,
      });
      const amountText = `AED ${Number(record.amount).toFixed(2)}`;
      const amountWidth = font.widthOfTextAtSize(amountText, 9);
      currentPage.drawText(amountText, {
        x: margin + 500 - amountWidth,
        y,
        size: 9,
        font,
        color: record.type === 'revenue' ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0),
      });

      y -= lineHeight;
    });

    // Footer on last page
    y = 50;
    currentPage.drawLine({
      start: { x: margin, y },
      end: { x: 562, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 15;
    currentPage.drawText(
      `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`,
      {
        x: margin,
        y,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Send PDF
    const filename = `statement-${owner.name.replace(/\s+/g, '-')}-${format(start, 'yyyy-MM')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error: any) {
    next(error);
  }
};

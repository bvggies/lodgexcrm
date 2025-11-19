import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { createObjectCsvWriter } from 'csv-writer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export const getFinanceRecords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      propertyId,
      bookingId,
      type,
      category,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    if (bookingId) {
      where.bookingId = bookingId as string;
    }

    if (type) {
      where.type = type as string;
    }

    if (category) {
      where.category = category as string;
    }

    if (status) {
      where.status = status as string;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const records = await prisma.financeRecord.findMany({
      where,
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
            guest: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate totals
    const revenue = records
      .filter((r) => r.type === 'revenue')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const expenses = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const netIncome = revenue - expenses;

    res.json({
      success: true,
      data: {
        records,
        summary: {
          revenue,
          expenses,
          netIncome,
          count: records.length,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getFinanceRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await prisma.financeRecord.findUnique({
      where: { id },
      include: {
        property: true,
        booking: {
          include: {
            guest: true,
          },
        },
        guest: true,
      },
    });

    if (!record) {
      return next(createError('Finance record not found', 404));
    }

    res.json({
      success: true,
      data: { record },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createFinanceRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const {
      type,
      propertyId,
      bookingId,
      guestId,
      amount,
      category,
      invoiceFile,
      date,
      paymentMethod,
      status,
    } = req.body;

    // Validate type
    if (!['revenue', 'expense'].includes(type)) {
      return next(createError('Invalid finance record type', 400));
    }

    // Verify property if provided
    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        return next(createError('Property not found', 404));
      }
    }

    // Verify booking if provided
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return next(createError('Booking not found', 404));
      }
    }

    // Verify guest if provided
    if (guestId) {
      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
      });

      if (!guest) {
        return next(createError('Guest not found', 404));
      }
    }

    const record = await prisma.financeRecord.create({
      data: {
        type,
        propertyId: propertyId || null,
        bookingId: bookingId || null,
        guestId: guestId || null,
        amount: parseFloat(amount),
        category,
        invoiceFile: invoiceFile || null,
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || null,
        status: status || 'pending',
      },
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

    // Audit log
    await auditLog('create', 'finance_records', record.id, req.user.userId, {
      type: record.type,
      amount: record.amount,
      category: record.category,
    });

    res.status(201).json({
      success: true,
      data: { record },
      message: 'Finance record created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateFinanceRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const updateData: any = { ...req.body };

    // Check if record exists
    const existingRecord = await prisma.financeRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return next(createError('Finance record not found', 404));
    }

    // Convert numeric and date fields
    if (updateData.amount !== undefined) {
      updateData.amount = parseFloat(updateData.amount);
    }

    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const record = await prisma.financeRecord.update({
      where: { id },
      data: updateData,
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

    // Audit log
    await auditLog('update', 'finance_records', record.id, req.user.userId, {
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: { record },
      message: 'Finance record updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteFinanceRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    // Check if record exists
    const record = await prisma.financeRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return next(createError('Finance record not found', 404));
    }

    await prisma.financeRecord.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'finance_records', id, req.user.userId, {
      type: record.type,
      amount: record.amount,
    });

    res.json({
      success: true,
      message: 'Finance record deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const getMonthlyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, month } = req.query; // month format: YYYY-MM

    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = (month as string).split('-').map(Number);
      startDate = startOfMonth(new Date(year, monthNum - 1));
      endDate = endOfMonth(new Date(year, monthNum - 1));
    } else {
      // Current month
      const now = new Date();
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    const records = await prisma.financeRecord.findMany({
      where,
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
            reference: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate totals by category
    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    let totalRevenue = 0;
    let totalExpenses = 0;

    records.forEach((record) => {
      const amount = Number(record.amount);
      if (record.type === 'revenue') {
        totalRevenue += amount;
        revenueByCategory[record.category] =
          (revenueByCategory[record.category] || 0) + amount;
      } else {
        totalExpenses += amount;
        expensesByCategory[record.category] =
          (expensesByCategory[record.category] || 0) + amount;
      }
    });

    const netIncome = totalRevenue - totalExpenses;

    res.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          month: format(startDate, 'yyyy-MM'),
        },
        summary: {
          totalRevenue,
          totalExpenses,
          netIncome,
          recordCount: records.length,
        },
        revenueByCategory,
        expensesByCategory,
        records,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const exportFinanceRecordsCSV = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, startDate, endDate, type } = req.query;

    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    if (type) {
      where.type = type as string;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const records = await prisma.financeRecord.findMany({
      where,
      include: {
        property: {
          select: {
            name: true,
            code: true,
          },
        },
        booking: {
          select: {
            reference: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Create CSV file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = `finance-records-${Date.now()}.csv`;
    const filepath = path.join(tempDir, filename);

    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'type', title: 'Type' },
        { id: 'category', title: 'Category' },
        { id: 'amount', title: 'Amount' },
        { id: 'property', title: 'Property' },
        { id: 'booking', title: 'Booking Reference' },
        { id: 'paymentMethod', title: 'Payment Method' },
        { id: 'status', title: 'Status' },
      ],
    });

    const csvData = records.map((record) => ({
      date: format(new Date(record.date), 'yyyy-MM-dd'),
      type: record.type,
      category: record.category,
      amount: record.amount.toString(),
      property: record.property?.name || 'N/A',
      booking: record.booking?.reference || 'N/A',
      paymentMethod: record.paymentMethod || 'N/A',
      status: record.status,
    }));

    await csvWriter.writeRecords(csvData);

    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Clean up temp file
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 5000);
    });
  } catch (error: any) {
    next(error);
  }
};

export const exportFinanceRecordsPDF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, month } = req.query;

    // Get monthly report data
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = (month as string).split('-').map(Number);
      startDate = startOfMonth(new Date(year, monthNum - 1));
      endDate = endOfMonth(new Date(year, monthNum - 1));
    } else {
      const now = new Date();
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    const records = await prisma.financeRecord.findMany({
      where,
      include: {
        property: {
          select: {
            name: true,
            code: true,
          },
        },
        booking: {
          select: {
            reference: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate totals
    const totalRevenue = records
      .filter((r) => r.type === 'revenue')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const totalExpenses = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const netIncome = totalRevenue - totalExpenses;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 750;
    const margin = 50;
    const lineHeight = 20;

    // Title
    page.drawText('Finance Report', {
      x: margin,
      y,
      size: 24,
      font: boldFont,
    });

    y -= 40;

    // Period
    page.drawText(
      `Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
      {
        x: margin,
        y,
        size: 12,
        font,
      }
    );

    y -= 30;

    // Summary
    page.drawText('Summary', {
      x: margin,
      y,
      size: 16,
      font: boldFont,
    });

    y -= lineHeight;
    page.drawText(`Total Revenue: $${totalRevenue.toFixed(2)}`, {
      x: margin + 20,
      y,
      size: 12,
      font,
    });

    y -= lineHeight;
    page.drawText(`Total Expenses: $${totalExpenses.toFixed(2)}`, {
      x: margin + 20,
      y,
      size: 12,
      font,
    });

    y -= lineHeight;
    page.drawText(`Net Income: $${netIncome.toFixed(2)}`, {
      x: margin + 20,
      y,
      size: 12,
      font: boldFont,
      color: netIncome >= 0 ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0),
    });

    y -= 30;

    // Records table header
    page.drawText('Date', { x: margin, y, size: 10, font: boldFont });
    page.drawText('Type', { x: margin + 80, y, size: 10, font: boldFont });
    page.drawText('Category', { x: margin + 140, y, size: 10, font: boldFont });
    page.drawText('Amount', { x: margin + 250, y, size: 10, font: boldFont });
    page.drawText('Property', { x: margin + 320, y, size: 10, font: boldFont });

    y -= lineHeight;

    // Records
    records.slice(0, 30).forEach((record) => {
      if (y < 100) {
        // New page if needed
        const newPage = pdfDoc.addPage([612, 792]);
        y = 750;
      }

      page.drawText(format(new Date(record.date), 'MM/dd/yyyy'), {
        x: margin,
        y,
        size: 9,
        font,
      });
      page.drawText(record.type, {
        x: margin + 80,
        y,
        size: 9,
        font,
      });
      page.drawText(record.category.substring(0, 15), {
        x: margin + 140,
        y,
        size: 9,
        font,
      });
      page.drawText(`$${Number(record.amount).toFixed(2)}`, {
        x: margin + 250,
        y,
        size: 9,
        font,
      });
      page.drawText(record.property?.name.substring(0, 15) || 'N/A', {
        x: margin + 320,
        y,
        size: 9,
        font,
      });

      y -= lineHeight;
    });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Send PDF
    const filename = `finance-report-${format(startDate, 'yyyy-MM')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error: any) {
    next(error);
  }
};


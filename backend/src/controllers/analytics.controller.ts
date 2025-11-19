import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, format } from 'date-fns';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';

export const getDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = subDays(now, 7);

    // Total properties
    const totalProperties = await prisma.property.count({
      where: { status: 'active' },
    });

    // Active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        checkinDate: { lte: now },
        checkoutDate: { gte: now },
      },
    });

    // Upcoming check-ins (next 7 days)
    const upcomingCheckins = await prisma.booking.findMany({
      where: {
        checkinDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        property: {
          select: {
            name: true,
            code: true,
          },
        },
        guest: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        checkinDate: 'asc',
      },
      take: 10,
    });

    // Upcoming check-outs (next 7 days)
    const upcomingCheckouts = await prisma.booking.findMany({
      where: {
        checkoutDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        property: {
          select: {
            name: true,
            code: true,
          },
        },
        guest: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        checkoutDate: 'asc',
      },
      take: 10,
    });

    // Pending cleaning tasks
    const pendingCleaningTasks = await prisma.cleaningTask.count({
      where: {
        status: { in: ['not_started', 'in_progress'] },
        scheduledDate: { lte: sevenDaysFromNow },
      },
    });

    // Pending maintenance tasks
    const pendingMaintenanceTasks = await prisma.maintenanceTask.count({
      where: {
        status: { in: ['open', 'in_progress'] },
      },
    });

    // Unpaid bookings
    const unpaidBookings = await prisma.booking.findMany({
      where: {
        paymentStatus: { in: ['pending', 'partial'] },
      },
      include: {
        property: {
          select: {
            name: true,
            code: true,
          },
        },
        guest: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        checkinDate: 'asc',
      },
      take: 10,
    });

    // Monthly revenue (current month)
    const monthlyRevenue = await prisma.financeRecord.aggregate({
      where: {
        type: 'revenue',
        date: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Monthly expenses (current month)
    const monthlyExpenses = await prisma.financeRecord.aggregate({
      where: {
        type: 'expense',
        date: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Total guests
    const totalGuests = await prisma.guest.count();

    // Occupancy rate calculation (for current month)
    const totalBookingsThisMonth = await prisma.booking.count({
      where: {
        OR: [
          {
            checkinDate: { lte: endOfCurrentMonth },
            checkoutDate: { gte: startOfCurrentMonth },
          },
        ],
      },
    });

    // Calculate occupancy rate (simplified - can be enhanced)
    const totalNightsThisMonth = await prisma.booking.aggregate({
      where: {
        OR: [
          {
            checkinDate: { lte: endOfCurrentMonth },
            checkoutDate: { gte: startOfCurrentMonth },
          },
        ],
      },
      _sum: {
        nights: true,
      },
    });

    const daysInMonth = endOfCurrentMonth.getDate();
    const totalAvailableNights = totalProperties * daysInMonth;
    const occupancyRate =
      totalAvailableNights > 0
        ? ((totalNightsThisMonth._sum.nights || 0) / totalAvailableNights) * 100
        : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalProperties,
          activeBookings,
          totalGuests,
          pendingCleaningTasks,
          pendingMaintenanceTasks,
          unpaidBookingsCount: unpaidBookings.length,
        },
        financial: {
          monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
          monthlyExpenses: Number(monthlyExpenses._sum.amount || 0),
          monthlyNetIncome:
            Number(monthlyRevenue._sum.amount || 0) -
            Number(monthlyExpenses._sum.amount || 0),
        },
        occupancy: {
          rate: Math.round(occupancyRate * 100) / 100,
          totalBookings: totalBookingsThisMonth,
          totalNights: totalNightsThisMonth._sum.nights || 0,
        },
        upcomingCheckins: upcomingCheckins.slice(0, 5),
        upcomingCheckouts: upcomingCheckouts.slice(0, 5),
        unpaidBookings: unpaidBookings.slice(0, 5),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getPropertyAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return next(createError('Property not found', 404));
    }

    const now = new Date();
    const start = startDate ? new Date(startDate as string) : startOfMonth(now);
    const end = endDate ? new Date(endDate as string) : endOfMonth(now);

    // Bookings for this property
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId: id,
        OR: [
          {
            checkinDate: { lte: end },
            checkoutDate: { gte: start },
          },
        ],
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate occupancy
    const totalNights = bookings.reduce((sum, b) => sum + b.nights, 0);
    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const occupancyRate = daysInPeriod > 0 ? (totalNights / daysInPeriod) * 100 : 0;

    // Revenue
    const revenue = await prisma.financeRecord.aggregate({
      where: {
        propertyId: id,
        type: 'revenue',
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Expenses
    const expenses = await prisma.financeRecord.aggregate({
      where: {
        propertyId: id,
        type: 'expense',
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Average booking value
    const avgBookingValue =
      bookings.length > 0
        ? bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0) / bookings.length
        : 0;

    // Repeat guests
    const guestIds = bookings.map((b) => b.guestId);
    const uniqueGuests = new Set(guestIds).size;
    const repeatGuestRate =
      guestIds.length > 0 ? ((guestIds.length - uniqueGuests) / guestIds.length) * 100 : 0;

    // Channel breakdown
    const channelBreakdown = bookings.reduce((acc: Record<string, number>, booking) => {
      acc[booking.channel] = (acc[booking.channel] || 0) + 1;
      return acc;
    }, {});

    // Revenue by month (for chart)
    const monthlyRevenue = await prisma.financeRecord.findMany({
      where: {
        propertyId: id,
        type: 'revenue',
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        date: true,
        amount: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by month
    const revenueByMonth: Record<string, number> = {};
    monthlyRevenue.forEach((record) => {
      const monthKey = format(new Date(record.date), 'yyyy-MM');
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(record.amount);
    });

    res.json({
      success: true,
      data: {
        property: {
          id: property.id,
          name: property.name,
          code: property.code,
        },
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        metrics: {
          totalBookings: bookings.length,
          totalNights,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          totalRevenue: Number(revenue._sum.amount || 0),
          totalExpenses: Number(expenses._sum.amount || 0),
          netIncome:
            Number(revenue._sum.amount || 0) - Number(expenses._sum.amount || 0),
          avgBookingValue: Math.round(avgBookingValue * 100) / 100,
          uniqueGuests,
          repeatGuestRate: Math.round(repeatGuestRate * 100) / 100,
        },
        channelBreakdown,
        revenueByMonth: Object.entries(revenueByMonth).map(([month, amount]) => ({
          month,
          amount,
        })),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getRevenueExpenseChart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, propertyId } = req.query;

    const now = new Date();
    const start = startDate ? new Date(startDate as string) : startOfYear(now);
    const end = endDate ? new Date(endDate as string) : endOfYear(now);

    const where: any = {
      date: {
        gte: start,
        lte: end,
      },
    };

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    const records = await prisma.financeRecord.findMany({
      where,
      select: {
        date: true,
        type: true,
        amount: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by month
    const monthlyData: Record<string, { revenue: number; expense: number }> = {};

    records.forEach((record) => {
      const monthKey = format(new Date(record.date), 'yyyy-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expense: 0 };
      }
      if (record.type === 'revenue') {
        monthlyData[monthKey].revenue += Number(record.amount);
      } else {
        monthlyData[monthKey].expense += Number(record.amount);
      }
    });

    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
      netIncome: Math.round((data.revenue - data.expense) * 100) / 100,
    }));

    res.json({
      success: true,
      data: {
        chartData,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getOccupancyRates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const now = new Date();
    const start = startDate ? new Date(startDate as string) : startOfMonth(now);
    const end = endDate ? new Date(endDate as string) : endOfMonth(now);

    const properties = await prisma.property.findMany({
      where: { status: 'active' },
      include: {
        bookings: {
          where: {
            OR: [
              {
                checkinDate: { lte: end },
                checkoutDate: { gte: start },
              },
            ],
          },
        },
      },
    });

    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const occupancyData = properties.map((property) => {
      const totalNights = property.bookings.reduce((sum, b) => sum + b.nights, 0);
      const occupancyRate = daysInPeriod > 0 ? (totalNights / daysInPeriod) * 100 : 0;

      return {
        propertyId: property.id,
        propertyName: property.name,
        propertyCode: property.code,
        totalBookings: property.bookings.length,
        totalNights,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      };
    });

    // Overall occupancy
    const totalNights = occupancyData.reduce((sum, p) => sum + p.totalNights, 0);
    const totalAvailableNights = properties.length * daysInPeriod;
    const overallOccupancyRate =
      totalAvailableNights > 0 ? (totalNights / totalAvailableNights) * 100 : 0;

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        overallOccupancyRate: Math.round(overallOccupancyRate * 100) / 100,
        properties: occupancyData,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getRepeatGuestsAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const guests = await prisma.guest.findMany({
      include: {
        bookings: {
          select: {
            id: true,
            checkinDate: true,
            totalAmount: true,
          },
          orderBy: {
            checkinDate: 'desc',
          },
        },
      },
    });

    const repeatGuests = guests.filter((g) => g.bookings.length > 1);
    const oneTimeGuests = guests.filter((g) => g.bookings.length === 1);

    const repeatGuestPercentage =
      guests.length > 0 ? (repeatGuests.length / guests.length) * 100 : 0;

    // Calculate average spend for repeat vs one-time guests
    const avgRepeatGuestSpend =
      repeatGuests.length > 0
        ? repeatGuests.reduce((sum, g) => sum + Number(g.totalSpend), 0) /
          repeatGuests.length
        : 0;

    const avgOneTimeGuestSpend =
      oneTimeGuests.length > 0
        ? oneTimeGuests.reduce((sum, g) => sum + Number(g.totalSpend), 0) /
          oneTimeGuests.length
        : 0;

    // Top repeat guests
    const topRepeatGuests = repeatGuests
      .sort((a, b) => Number(b.totalSpend) - Number(a.totalSpend))
      .slice(0, 10)
      .map((g) => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        totalBookings: g.bookings.length,
        totalSpend: Number(g.totalSpend),
        lastBookingDate: g.bookings[0]?.checkinDate.toISOString(),
      }));

    res.json({
      success: true,
      data: {
        summary: {
          totalGuests: guests.length,
          repeatGuests: repeatGuests.length,
          oneTimeGuests: oneTimeGuests.length,
          repeatGuestPercentage: Math.round(repeatGuestPercentage * 100) / 100,
        },
        averages: {
          avgRepeatGuestSpend: Math.round(avgRepeatGuestSpend * 100) / 100,
          avgOneTimeGuestSpend: Math.round(avgOneTimeGuestSpend * 100) / 100,
        },
        topRepeatGuests,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const exportAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, format: exportFormat } = req.query;
    
    const start = startDate ? new Date(startDate as string) : subDays(new Date(), 365);
    const end = endDate ? new Date(endDate as string) : new Date();
    const formatType = (exportFormat as string) || 'csv';

    if (formatType === 'csv') {
      // Get all analytics data
      const [revenueData, occupancyData, repeatGuestsData] = await Promise.all([
        prisma.financeRecord.findMany({
          where: {
            date: { gte: start, lte: end },
            type: 'revenue',
          },
          include: {
            property: { select: { name: true, code: true } },
            booking: { select: { reference: true } },
          },
          orderBy: { date: 'desc' },
        }),
        prisma.booking.findMany({
          where: {
            checkinDate: { gte: start, lte: end },
          },
          include: {
            property: { select: { name: true, code: true } },
            unit: { select: { unitCode: true } },
          },
        }),
        prisma.guest.findMany({
          include: {
            bookings: {
              where: {
                checkinDate: { gte: start, lte: end },
              },
            },
          },
        }),
      ]);

      // Create CSV file
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filename = `analytics-export-${Date.now()}.csv`;
      const filepath = path.join(tempDir, filename);

      // Calculate summary data
      const totalRevenue = revenueData.reduce((sum, r) => sum + Number(r.amount), 0);
      const totalBookings = occupancyData.length;
      const totalGuests = repeatGuestsData.length;
      const repeatGuests = repeatGuestsData.filter((g) => g.bookings.length > 1).length;
      const repeatGuestPercentage = totalGuests > 0 ? (repeatGuests / totalGuests) * 100 : 0;

      // Create CSV with summary and detailed data
      const csvWriter = createObjectCsvWriter({
        path: filepath,
        header: [
          { id: 'section', title: 'Section' },
          { id: 'metric', title: 'Metric' },
          { id: 'value', title: 'Value' },
          { id: 'details', title: 'Details' },
        ],
      });

      const csvData = [
        // Summary section
        { section: 'Summary', metric: 'Total Revenue (AED)', value: totalRevenue.toFixed(2), details: '' },
        { section: 'Summary', metric: 'Total Bookings', value: totalBookings.toString(), details: '' },
        { section: 'Summary', metric: 'Total Guests', value: totalGuests.toString(), details: '' },
        { section: 'Summary', metric: 'Repeat Guests', value: repeatGuests.toString(), details: '' },
        { section: 'Summary', metric: 'Repeat Guest %', value: repeatGuestPercentage.toFixed(2) + '%', details: '' },
        { section: '', metric: '', value: '', details: '' },
        // Revenue details
        { section: 'Revenue Details', metric: 'Date', value: 'Type', details: 'Amount (AED)' },
        ...revenueData.slice(0, 100).map((r) => ({
          section: 'Revenue Details',
          metric: format(new Date(r.date), 'yyyy-MM-dd'),
          value: r.category,
          details: Number(r.amount).toFixed(2),
        })),
        { section: '', metric: '', value: '', details: '' },
        // Booking details
        { section: 'Booking Details', metric: 'Check-in', value: 'Property', details: 'Unit' },
        ...occupancyData.slice(0, 100).map((b) => ({
          section: 'Booking Details',
          metric: format(new Date(b.checkinDate), 'yyyy-MM-dd'),
          value: b.property?.name || 'N/A',
          details: b.unit?.unitCode || 'N/A',
        })),
      ];

      await csvWriter.writeRecords(csvData);

      // Send file
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
    } else {
      return next(createError('Only CSV format is supported for analytics export', 400));
    }
  } catch (error: any) {
    next(error);
  }
};


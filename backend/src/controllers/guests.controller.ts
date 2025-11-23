import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

export const getGuests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { blacklist, search, minSpend } = req.query;
    const where: any = {};

    if (blacklist === 'true') {
      where.blacklist = true;
    } else if (blacklist === 'false') {
      where.blacklist = false;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (minSpend) {
      where.totalSpend = {
        gte: parseFloat(minSpend as string),
      };
    }

    const guests = await prisma.guest.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { guests },
      count: guests.length,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { checkinDate: 'desc' },
          include: {
            property: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        financeRecords: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!guest) {
      return next(createError('Guest not found', 404));
    }

    res.json({
      success: true,
      data: { guest },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      nationality,
      passportScanUrl,
      documents,
      blacklist,
    } = req.body;

    const guest = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        nationality,
        passportScanUrl,
        documents: documents || [],
        blacklist: blacklist || false,
      },
    });

    // Audit log
    await auditLog('create', 'guests', guest.id, req.user.userId, {
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
    });

    res.status(201).json({
      success: true,
      data: { guest },
      message: 'Guest created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if guest exists
    const existingGuest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!existingGuest) {
      return next(createError('Guest not found', 404));
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await auditLog('update', 'guests', guest.id, req.user.userId, {
      changes: updateData,
    });

    res.json({
      success: true,
      data: { guest },
      message: 'Guest updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    // Check if guest exists
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!guest) {
      return next(createError('Guest not found', 404));
    }

    // Check if guest has bookings
    if (guest._count.bookings > 0) {
      return next(createError('Cannot delete guest with existing bookings', 400));
    }

    await prisma.guest.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'guests', id, req.user.userId, {
      firstName: guest.firstName,
      lastName: guest.lastName,
    });

    res.json({
      success: true,
      message: 'Guest deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const getGuestStayHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!guest) {
      return next(createError('Guest not found', 404));
    }

    const bookings = await prisma.booking.findMany({
      where: { guestId: id },
      include: {
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

    res.json({
      success: true,
      data: { bookings },
      count: bookings.length,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getGuestPaymentRecords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!guest) {
      return next(createError('Guest not found', 404));
    }

    const financeRecords = await prisma.financeRecord.findMany({
      where: { guestId: id },
      include: {
        booking: {
          select: {
            id: true,
            reference: true,
            checkinDate: true,
            checkoutDate: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate totals
    const totalPaid = financeRecords
      .filter((r) => r.status === 'paid' && r.type === 'revenue')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    
    const totalPending = financeRecords
      .filter((r) => r.status === 'pending' && r.type === 'revenue')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    res.json({
      success: true,
      data: {
        records: financeRecords,
        summary: {
          totalPaid,
          totalPending,
          totalRecords: financeRecords.length,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getGuestSecurityDeposits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!guest) {
      return next(createError('Guest not found', 404));
    }

    const bookings = await prisma.booking.findMany({
      where: {
        guestId: id,
        depositAmount: { not: null },
      },
      include: {
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

    // Calculate deposit summary
    const totalDeposits = bookings.reduce((sum, b) => sum + Number(b.depositAmount || 0), 0);
    const activeDeposits = bookings
      .filter((b) => {
        const checkout = new Date(b.checkoutDate);
        const today = new Date();
        return checkout >= today;
      })
      .reduce((sum, b) => sum + Number(b.depositAmount || 0), 0);

    res.json({
      success: true,
      data: {
        deposits: bookings.map((b) => ({
          bookingId: b.id,
          reference: b.reference,
          property: b.property,
          unit: b.unit,
          depositAmount: b.depositAmount,
          checkinDate: b.checkinDate,
          checkoutDate: b.checkoutDate,
          isActive: new Date(b.checkoutDate) >= new Date(),
        })),
        summary: {
          totalDeposits,
          activeDeposits,
          totalBookings: bookings.length,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};


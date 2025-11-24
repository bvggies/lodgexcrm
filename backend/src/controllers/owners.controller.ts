import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import crypto from 'crypto';

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
    const updateData: any = { ...req.body };

    // Check if owner exists
    const existingOwner = await prisma.owner.findUnique({
      where: { id },
    });

    if (!existingOwner) {
      return next(createError('Owner not found', 404));
    }

    // Encrypt bank details if being updated
    if (updateData.bankDetails) {
      updateData.bankDetails = encrypt(JSON.stringify(updateData.bankDetails));
    }

    const owner = await prisma.owner.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await auditLog('update', 'owners', owner.id, req.user.userId, {
      changes: Object.keys(updateData),
    });

    // Return decrypted bank details
    const ownerData: any = { ...owner };
    if (owner.bankDetails) {
      try {
        ownerData.bankDetails = JSON.parse(decrypt(owner.bankDetails));
      } catch (e) {
        ownerData.bankDetails = owner.bankDetails;
      }
    }

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

    // Check if owner exists
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });

    if (!owner) {
      return next(createError('Owner not found', 404));
    }

    // Check if owner has properties
    if (owner._count.properties > 0) {
      return next(createError('Cannot delete owner with existing properties', 400));
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


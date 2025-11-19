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


import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

export const getUnits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, availabilityStatus } = req.query;
    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    if (availabilityStatus) {
      where.availabilityStatus = availabilityStatus as string;
    }

    const units = await prisma.unit.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        unitCode: 'asc',
      },
    });

    res.json({
      success: true,
      data: { units },
      count: units.length,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getUnit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
        bookings: {
          orderBy: { checkinDate: 'desc' },
          take: 10,
          include: {
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!unit) {
      return next(createError('Unit not found', 404));
    }

    res.json({
      success: true,
      data: { unit },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createUnit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const {
      propertyId,
      unitCode,
      floor,
      size,
      currentPrice,
      availabilityStatus,
    } = req.body;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return next(createError('Property not found', 404));
    }

    // Check if unit code already exists for this property
    const existingUnit = await prisma.unit.findUnique({
      where: {
        propertyId_unitCode: {
          propertyId,
          unitCode,
        },
      },
    });

    if (existingUnit) {
      return next(createError('Unit code already exists for this property', 409));
    }

    const unit = await prisma.unit.create({
      data: {
        propertyId,
        unitCode,
        floor: floor ? parseInt(floor) : null,
        size: size ? parseFloat(size) : null,
        currentPrice: currentPrice ? parseFloat(currentPrice) : null,
        availabilityStatus: availabilityStatus || 'available',
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
    await auditLog('create', 'units', unit.id, req.user.userId, {
      propertyId: unit.propertyId,
      unitCode: unit.unitCode,
    });

    res.status(201).json({
      success: true,
      data: { unit },
      message: 'Unit created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateUnit = async (
  req: AuthRequest,
  res: Response, next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const updateData: any = { ...req.body };

    // Check if unit exists
    const existingUnit = await prisma.unit.findUnique({
      where: { id },
    });

    if (!existingUnit) {
      return next(createError('Unit not found', 404));
    }

    // If unitCode is being updated, check for duplicates
    if (updateData.unitCode && updateData.unitCode !== existingUnit.unitCode) {
      const codeExists = await prisma.unit.findUnique({
        where: {
          propertyId_unitCode: {
            propertyId: existingUnit.propertyId,
            unitCode: updateData.unitCode,
          },
        },
      });

      if (codeExists) {
        return next(createError('Unit code already exists for this property', 409));
      }
    }

    // Convert numeric fields
    if (updateData.floor !== undefined) {
      updateData.floor = updateData.floor ? parseInt(updateData.floor) : null;
    }
    if (updateData.size !== undefined) {
      updateData.size = updateData.size ? parseFloat(updateData.size) : null;
    }
    if (updateData.currentPrice !== undefined) {
      updateData.currentPrice = updateData.currentPrice ? parseFloat(updateData.currentPrice) : null;
    }

    const unit = await prisma.unit.update({
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
    await auditLog('update', 'units', unit.id, req.user.userId, {
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: { unit },
      message: 'Unit updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteUnit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!unit) {
      return next(createError('Unit not found', 404));
    }

    // Check if unit has bookings
    if (unit._count.bookings > 0) {
      return next(createError('Cannot delete unit with existing bookings', 400));
    }

    await prisma.unit.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'units', id, req.user.userId, {
      propertyId: unit.propertyId,
      unitCode: unit.unitCode,
    });

    res.json({
      success: true,
      message: 'Unit deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};


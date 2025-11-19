import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

export const getProperties = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, ownerId, search } = req.query;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (ownerId) {
      where.ownerId = ownerId as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            units: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { properties },
      count: properties.length,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getProperty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: true,
        units: true,
        bookings: {
          take: 10,
          orderBy: { checkinDate: 'desc' },
          include: {
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            units: true,
            cleaningTasks: true,
            maintenanceTasks: true,
          },
        },
      },
    });

    if (!property) {
      return next(createError('Property not found', 404));
    }

    res.json({
      success: true,
      data: { property },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createProperty = async (
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
      code,
      unitType,
      address,
      locationLat,
      locationLng,
      ownerId,
      status,
      dewaNumber,
      dtcmPermitNumber,
      amenities,
    } = req.body;

    // Check if code already exists
    const existingProperty = await prisma.property.findUnique({
      where: { code },
    });

    if (existingProperty) {
      return next(createError('Property code already exists', 409));
    }

    // Verify owner exists
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return next(createError('Owner not found', 404));
    }

    const property = await prisma.property.create({
      data: {
        name,
        code,
        unitType,
        address: address || {},
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        ownerId,
        status: status || 'active',
        dewaNumber,
        dtcmPermitNumber,
        amenities: amenities || [],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await auditLog('create', 'properties', property.id, req.user.userId, {
      name: property.name,
      code: property.code,
    });

    res.status(201).json({
      success: true,
      data: { property },
      message: 'Property created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateProperty = async (
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

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      return next(createError('Property not found', 404));
    }

    // If code is being updated, check for duplicates
    if (updateData.code && updateData.code !== existingProperty.code) {
      const codeExists = await prisma.property.findUnique({
        where: { code: updateData.code },
      });

      if (codeExists) {
        return next(createError('Property code already exists', 409));
      }
    }

    // If ownerId is being updated, verify owner exists
    if (updateData.ownerId) {
      const owner = await prisma.owner.findUnique({
        where: { id: updateData.ownerId },
      });

      if (!owner) {
        return next(createError('Owner not found', 404));
      }
    }

    // Convert location coordinates if provided
    if (updateData.locationLat) {
      updateData.locationLat = parseFloat(updateData.locationLat);
    }
    if (updateData.locationLng) {
      updateData.locationLng = parseFloat(updateData.locationLng);
    }

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await auditLog('update', 'properties', property.id, req.user.userId, {
      changes: updateData,
    });

    res.json({
      success: true,
      data: { property },
      message: 'Property updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteProperty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            units: true,
          },
        },
      },
    });

    if (!property) {
      return next(createError('Property not found', 404));
    }

    // Check if property has active bookings or units
    if (property._count.bookings > 0 || property._count.units > 0) {
      return next(
        createError(
          'Cannot delete property with existing bookings or units',
          400
        )
      );
    }

    await prisma.property.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'properties', id, req.user.userId, {
      name: property.name,
      code: property.code,
    });

    res.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};


import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { v4 as uuidv4 } from 'uuid';

export const getCleaningTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, status, cleanerId, startDate, endDate } = req.query;
    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    if (status) {
      where.status = status as string;
    }

    if (cleanerId) {
      where.cleanerId = cleanerId as string;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) {
        where.scheduledDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.scheduledDate.lte = new Date(endDate as string);
      }
    }

    const tasks = await prisma.cleaningTask.findMany({
      where,
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
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    res.json({
      success: true,
      data: { tasks },
      count: tasks.length,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getCleaningTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await prisma.cleaningTask.findUnique({
      where: { id },
      include: {
        property: true,
        unit: true,
        booking: {
          include: {
            guest: true,
          },
        },
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!task) {
      return next(createError('Cleaning task not found', 404));
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createCleaningTask = async (
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
      unitId,
      bookingId,
      scheduledDate,
      cleanerId,
      checklist,
      notes,
    } = req.body;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return next(createError('Property not found', 404));
    }

    // Verify unit if provided
    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
      });

      if (!unit || unit.propertyId !== propertyId) {
        return next(createError('Unit not found or does not belong to property', 404));
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

    // Verify cleaner if provided
    if (cleanerId) {
      const cleaner = await prisma.user.findUnique({
        where: { id: cleanerId },
      });

      if (!cleaner || (cleaner.role !== 'cleaner' && cleaner.role !== 'admin')) {
        return next(createError('Invalid cleaner assigned', 400));
      }
    }

    // Generate unique cleaning ID
    const cleaningId = `CLN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const task = await prisma.cleaningTask.create({
      data: {
        cleaningId,
        propertyId,
        unitId: unitId || null,
        bookingId: bookingId || null,
        scheduledDate: new Date(scheduledDate),
        cleanerId: cleanerId || null,
        status: 'not_started',
        checklist: checklist || [],
        notes,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Booking is already linked via bookingId field in task

    // Audit log
    await auditLog('create', 'cleaning_tasks', task.id, req.user.userId, {
      cleaningId: task.cleaningId,
      propertyId: task.propertyId,
    });

    res.status(201).json({
      success: true,
      data: { task },
      message: 'Cleaning task created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateCleaningTask = async (
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

    // Check if task exists
    const existingTask = await prisma.cleaningTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return next(createError('Cleaning task not found', 404));
    }

    // Convert scheduledDate if provided
    if (updateData.scheduledDate) {
      updateData.scheduledDate = new Date(updateData.scheduledDate);
    }

    // Verify cleaner if being updated
    if (updateData.cleanerId) {
      const cleaner = await prisma.user.findUnique({
        where: { id: updateData.cleanerId },
      });

      if (!cleaner || (cleaner.role !== 'cleaner' && cleaner.role !== 'admin')) {
        return next(createError('Invalid cleaner assigned', 400));
      }
    }

    const task = await prisma.cleaningTask.update({
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
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    await auditLog('update', 'cleaning_tasks', task.id, req.user.userId, {
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: { task },
      message: 'Cleaning task updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteCleaningTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    // Check if task exists
    const task = await prisma.cleaningTask.findUnique({
      where: { id },
    });

    if (!task) {
      return next(createError('Cleaning task not found', 404));
    }

    // Booking link is removed by setting bookingId to null in task

    await prisma.cleaningTask.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'cleaning_tasks', id, req.user.userId, {
      cleaningId: task.cleaningId,
    });

    res.json({
      success: true,
      message: 'Cleaning task deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const completeCleaningTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const { afterPhotos, notes, cost } = req.body;

    const task = await prisma.cleaningTask.findUnique({
      where: { id },
    });

    if (!task) {
      return next(createError('Cleaning task not found', 404));
    }

    // Only cleaner assigned to task or admin can complete
    if (
      task.cleanerId !== req.user.userId &&
      req.user.role !== 'admin' &&
      req.user.role !== 'assistant'
    ) {
      return next(createError('Not authorized to complete this task', 403));
    }

    const updateData: any = {
      status: 'completed',
    };

    if (afterPhotos) {
      updateData.afterPhotos = Array.isArray(afterPhotos) ? afterPhotos : [afterPhotos];
    }

    if (notes) {
      updateData.notes = task.notes
        ? `${task.notes}\n[COMPLETED] ${new Date().toISOString()}: ${notes}`
        : `[COMPLETED] ${new Date().toISOString()}: ${notes}`;
    }

    if (cost !== undefined) {
      updateData.cost = parseFloat(cost);
    }

    const updatedTask = await prisma.cleaningTask.update({
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
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create finance record for cleaning expense if cost provided
    if (cost) {
      await prisma.financeRecord.create({
        data: {
          type: 'expense',
          propertyId: task.propertyId,
          amount: parseFloat(cost),
          category: 'cleaning',
          date: new Date(),
          paymentMethod: 'cash',
          status: 'paid',
        },
      });
    }

    // Audit log
    await auditLog('update', 'cleaning_tasks', id, req.user.userId, {
      action: 'completed',
      cost: cost || null,
    });

    res.json({
      success: true,
      data: { task: updatedTask },
      message: 'Cleaning task completed successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const uploadCleaningPhotos = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const { type, photoUrl } = req.body; // type: 'before' or 'after'

    if (!['before', 'after'].includes(type)) {
      return next(createError('Invalid photo type. Must be "before" or "after"', 400));
    }

    const task = await prisma.cleaningTask.findUnique({
      where: { id },
    });

    if (!task) {
      return next(createError('Cleaning task not found', 404));
    }

    const updateData: any = {};
    const currentPhotos = type === 'before' 
      ? (task.beforePhotos as string[] || [])
      : (task.afterPhotos as string[] || []);

    currentPhotos.push(photoUrl);
    updateData[type === 'before' ? 'beforePhotos' : 'afterPhotos'] = currentPhotos;

    const updatedTask = await prisma.cleaningTask.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: { task: updatedTask },
      message: 'Photo uploaded successfully',
    });
  } catch (error: any) {
    next(error);
  }
};


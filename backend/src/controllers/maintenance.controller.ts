import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

export const getMaintenanceTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, status, priority, type, assignedToId } = req.query;
    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    if (status) {
      where.status = status as string;
    }

    if (priority) {
      where.priority = priority as string;
    }

    if (type) {
      where.type = type as string;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId as string;
    }

    const tasks = await prisma.maintenanceTask.findMany({
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' }, // urgent, high, medium, low
        { createdAt: 'desc' },
      ],
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

export const getMaintenanceTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await prisma.maintenanceTask.findUnique({
      where: { id },
      include: {
        property: true,
        unit: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        booking: {
          select: {
            id: true,
            reference: true,
            checkinDate: true,
            checkoutDate: true,
          },
          include: {
            guest: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return next(createError('Maintenance task not found', 404));
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createMaintenanceTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const {
      title,
      propertyId,
      unitId,
      description,
      type,
      priority,
      assignedToId,
      photos,
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

    // Verify assigned user if provided
    if (assignedToId) {
      const user = await prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!user || (user.role !== 'maintenance' && user.role !== 'admin')) {
        return next(createError('Invalid user assigned', 400));
      }
    }

    const task = await prisma.maintenanceTask.create({
      data: {
        title,
        propertyId,
        unitId: unitId || null,
        description,
        type,
        priority: priority || 'medium',
        assignedToId: assignedToId || null,
        status: 'open',
        photos: photos || [],
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    await auditLog('create', 'maintenance_tasks', task.id, req.user.userId, {
      title: task.title,
      propertyId: task.propertyId,
      priority: task.priority,
    });

    res.status(201).json({
      success: true,
      data: { task },
      message: 'Maintenance task created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateMaintenanceTask = async (
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
    const existingTask = await prisma.maintenanceTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return next(createError('Maintenance task not found', 404));
    }

    // Verify assigned user if being updated
    if (updateData.assignedToId) {
      const user = await prisma.user.findUnique({
        where: { id: updateData.assignedToId },
      });

      if (!user || (user.role !== 'maintenance' && user.role !== 'admin')) {
        return next(createError('Invalid user assigned', 400));
      }
    }

    // Convert cost if provided
    if (updateData.cost !== undefined) {
      updateData.cost = updateData.cost ? parseFloat(updateData.cost) : null;
    }

    const task = await prisma.maintenanceTask.update({
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    await auditLog('update', 'maintenance_tasks', task.id, req.user.userId, {
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: { task },
      message: 'Maintenance task updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteMaintenanceTask = async (
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
    const task = await prisma.maintenanceTask.findUnique({
      where: { id },
    });

    if (!task) {
      return next(createError('Maintenance task not found', 404));
    }

    await prisma.maintenanceTask.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'maintenance_tasks', id, req.user.userId, {
      title: task.title,
    });

    res.json({
      success: true,
      message: 'Maintenance task deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const resolveMaintenanceTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const { photos, cost, invoiceFile, notes } = req.body;

    const task = await prisma.maintenanceTask.findUnique({
      where: { id },
    });

    if (!task) {
      return next(createError('Maintenance task not found', 404));
    }

    // Only assigned user or admin/assistant can resolve
    if (
      task.assignedToId !== req.user.userId &&
      req.user.role !== 'admin' &&
      req.user.role !== 'assistant'
    ) {
      return next(createError('Not authorized to resolve this task', 403));
    }

    const updateData: any = {
      status: 'completed',
      completedAt: new Date(),
    };

    if (photos) {
      const currentPhotos = (task.photos as string[] || []);
      const newPhotos = Array.isArray(photos) ? photos : [photos];
      updateData.photos = [...currentPhotos, ...newPhotos];
    }

    if (cost !== undefined) {
      updateData.cost = parseFloat(cost);
    }

    if (invoiceFile) {
      updateData.invoiceFile = invoiceFile;
    }

    if (notes) {
      updateData.notes = task.notes
        ? `${task.notes}\n[RESOLVED] ${new Date().toISOString()}: ${notes}`
        : `[RESOLVED] ${new Date().toISOString()}: ${notes}`;
    }

    const updatedTask = await prisma.maintenanceTask.update({
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create finance record for maintenance expense if cost provided
    if (cost) {
      await prisma.financeRecord.create({
        data: {
          type: 'expense',
          propertyId: task.propertyId,
          amount: parseFloat(cost),
          category: 'maintenance',
          date: new Date(),
          invoiceFile: invoiceFile || null,
          paymentMethod: 'bank_transfer',
          status: 'paid',
        },
      });
    }

    // Audit log
    await auditLog('update', 'maintenance_tasks', id, req.user.userId, {
      action: 'resolved',
      cost: cost || null,
    });

    res.json({
      success: true,
      data: { task: updatedTask },
      message: 'Maintenance task resolved successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const uploadMaintenancePhotos = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const { photoUrl } = req.body;

    const task = await prisma.maintenanceTask.findUnique({
      where: { id },
    });

    if (!task) {
      return next(createError('Maintenance task not found', 404));
    }

    const currentPhotos = (task.photos as string[] || []);
    currentPhotos.push(photoUrl);

    const updatedTask = await prisma.maintenanceTask.update({
      where: { id },
      data: {
        photos: currentPhotos,
      },
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


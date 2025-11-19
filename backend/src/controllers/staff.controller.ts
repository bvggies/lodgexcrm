import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { StaffRole } from '@prisma/client';

export const getStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, isActive, search } = req.query;
    const where: any = {};

    if (role) {
      where.role = role as StaffRole;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const staff = await prisma.staff.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { staff },
      count: staff.length,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getStaffMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const staffMember = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staffMember) {
      return next(createError('Staff member not found', 404));
    }

    res.json({
      success: true,
      data: { staff: staffMember },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createStaff = async (
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
      role,
      phone,
      email,
      documents,
      paymentInfo,
      isActive,
    } = req.body;

    // Validate role
    if (!Object.values(StaffRole).includes(role)) {
      return next(createError('Invalid staff role', 400));
    }

    const staffMember = await prisma.staff.create({
      data: {
        name,
        role,
        phone,
        email,
        documents: documents || [],
        paymentInfo: paymentInfo || {},
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Audit log
    await auditLog('create', 'staff', staffMember.id, req.user.userId, {
      name: staffMember.name,
      role: staffMember.role,
    });

    res.status(201).json({
      success: true,
      data: { staff: staffMember },
      message: 'Staff member created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateStaff = async (
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

    // Check if staff member exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return next(createError('Staff member not found', 404));
    }

    // Validate role if being updated
    if (updateData.role && !Object.values(StaffRole).includes(updateData.role)) {
      return next(createError('Invalid staff role', 400));
    }

    const staffMember = await prisma.staff.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await auditLog('update', 'staff', staffMember.id, req.user.userId, {
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: { staff: staffMember },
      message: 'Staff member updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    // Check if staff member exists
    const staffMember = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staffMember) {
      return next(createError('Staff member not found', 404));
    }

    await prisma.staff.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'staff', id, req.user.userId, {
      name: staffMember.name,
      role: staffMember.role,
    });

    res.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const getStaffTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'cleaning' or 'maintenance'

    const staffMember = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staffMember) {
      return next(createError('Staff member not found', 404));
    }

    // Note: Staff model doesn't have direct relations to tasks
    // We need to query User model instead if staff is linked to a user account
    // For now, return empty array as placeholder
    // This should be implemented when linking Staff to User accounts

    const tasks: any = {
      cleaning: [],
      maintenance: [],
    };

    res.json({
      success: true,
      data: {
        staff: {
          id: staffMember.id,
          name: staffMember.name,
          role: staffMember.role,
        },
        tasks,
      },
    });
  } catch (error: any) {
    next(error);
  }
};


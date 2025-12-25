import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { hashPassword } from '../utils/auth';
import { StaffRole } from '@prisma/client';

export const getUsers = async (
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
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        guestId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { users },
      count: users.length,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        guestId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return next(createError('User not found', 404));
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      isActive,
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(createError('User with this email already exists', 409));
    }

    // Validate role
    if (role && !Object.values(StaffRole).includes(role)) {
      return next(createError('Invalid user role', 400));
    }

    // Password is required when creating a user
    if (!password) {
      return next(createError('Password is required', 400));
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || StaffRole.assistant,
        phone,
        isActive: isActive !== undefined ? isActive : true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        guestId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await auditLog('create', 'user', user.id, req.user.userId, {
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: { user },
      message: 'User created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateUser = async (
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return next(createError('User not found', 404));
    }

    // Validate role if being updated
    if (updateData.role && !Object.values(StaffRole).includes(updateData.role)) {
      return next(createError('Invalid user role', 400));
    }

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.passwordHash = await hashPassword(updateData.password);
      delete updateData.password; // Remove plain password
    }

    // Remove passwordHash from updateData if password is not being updated
    if (!updateData.passwordHash) {
      delete updateData.passwordHash;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        guestId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await auditLog('update', 'user', user.id, req.user.userId, {
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: { user },
      message: 'User updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return next(createError('User not found', 404));
    }

    // Prevent deleting yourself
    if (user.id === req.user.userId) {
      return next(createError('You cannot delete your own account', 400));
    }

    await prisma.user.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'user', id, req.user.userId, {
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};


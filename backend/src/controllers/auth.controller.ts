import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  JWTPayload,
} from '../utils/auth';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { StaffRole } from '@prisma/client';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(createError('User already exists', 409));
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (default role is assistant, only admin can create admins)
    const userRole: StaffRole = role === 'admin' ? 'assistant' : (role || 'assistant');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: userRole,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        guestId: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { user },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const registerGuest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, nationality } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(createError('User already exists', 409));
    }

    // Check if guest exists with this email
    let guest = await prisma.guest.findFirst({
      where: { email },
    });

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create or update guest record
    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          email,
          firstName,
          lastName,
          phone,
          nationality,
        },
      });
    } else {
      // Update guest if exists but no user
      guest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          firstName,
          lastName,
          phone,
          nationality,
        },
      });
    }

    // Create user with guest role and link to guest
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: StaffRole.guest,
        phone,
        guestId: guest.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        guestId: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { user, guest },
      message: 'Guest registered successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return next(createError('Invalid credentials', 401));
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      return next(createError('Invalid credentials', 401));
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7); // 7 days

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiry: refreshExpiry,
      },
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          guestId: user.guestId,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(createError('Refresh token required', 400));
    }

    // Verify refresh token
    let payload: JWTPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return next(createError('Invalid refresh token', 401));
    }

    // Check if token exists in DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return next(createError('Invalid refresh token', 401));
    }

    // Check expiry
    if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
      return next(createError('Refresh token expired', 401));
    }

    // Generate new access token
    const newPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(newPayload);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        guestId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(createError('User not found', 404));
    }

    // If user is a guest, include guest data
    let guest = null;
    if (user.guestId) {
      guest = await prisma.guest.findUnique({
        where: { id: user.guestId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          nationality: true,
          totalSpend: true,
        },
      });
    }

    res.json({
      success: true,
      data: { user, guest },
    });
  } catch (error: any) {
    next(error);
  }
};


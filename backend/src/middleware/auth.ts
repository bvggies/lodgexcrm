import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/auth';
import { createError } from './errorHandler';
import { StaffRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Authentication token required', 401);
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(createError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...allowedRoles: StaffRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

// Role check helpers
export const isAdmin = (role: StaffRole): boolean => role === 'admin';
export const isAssistant = (role: StaffRole): boolean => role === 'assistant' || role === 'admin';
export const isCleaner = (role: StaffRole): boolean => role === 'cleaner' || role === 'admin';
export const isMaintenance = (role: StaffRole): boolean => role === 'maintenance' || role === 'admin';
export const isOwnerView = (role: StaffRole): boolean => role === 'owner_view' || role === 'admin';


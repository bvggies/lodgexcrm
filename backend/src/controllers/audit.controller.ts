import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      userId,
      tableName,
      action,
      startDate,
      endDate,
      recordId,
      limit = 100,
      offset = 0,
    } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (tableName) {
      where.tableName = tableName as string;
    }

    if (action) {
      where.action = action as string;
    }

    if (recordId) {
      where.recordId = recordId as string;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: { logs },
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + parseInt(limit as string),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAuditLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      return next(createError('Audit log not found', 404));
    }

    res.json({
      success: true,
      data: { log },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getRecordHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tableName, recordId } = req.params;

    const logs = await prisma.auditLog.findMany({
      where: {
        tableName,
        recordId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    res.json({
      success: true,
      data: {
        tableName,
        recordId,
        history: logs,
        count: logs.length,
      },
    });
  } catch (error: any) {
    next(error);
  }
};


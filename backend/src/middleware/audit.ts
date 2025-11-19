import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from './auth';

export const auditLog = async (
  action: string,
  tableName: string,
  recordId: string,
  userId: string,
  changeSummary?: any
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        tableName,
        recordId,
        userId,
        changeSummary: changeSummary ? JSON.parse(JSON.stringify(changeSummary)) : null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

export const auditMiddleware = (action: string, tableName: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Log after response is sent
      if (req.user && res.statusCode < 400) {
        const recordId = req.params.id || body?.id || 'unknown';
        auditLog(action, tableName, recordId, req.user.userId, {
          body: req.body,
          params: req.params,
        }).catch(console.error);
      }

      return originalJson(body);
    };

    next();
  };
};


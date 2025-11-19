import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { createError } from './errorHandler';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg,
    }));

    const error = createError('Validation failed', 400);
    (error as any).details = errorMessages;
    return next(error);
  }

  next();
};


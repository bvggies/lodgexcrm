import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const uploadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next(createError('No file uploaded', 400));
    }

    const folder = (req.body.folder as string) || 'uploads';
    const result = await storageService.uploadFile(req.file, folder);

    res.json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
        bucket: result.bucket,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getSignedUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key } = req.params;
    const expiresIn = parseInt(req.query.expiresIn as string) || 3600;

    const url = await storageService.getSignedUrl(key, expiresIn);

    res.json({
      success: true,
      data: { url },
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key } = req.params;

    await storageService.deleteFile(key);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};


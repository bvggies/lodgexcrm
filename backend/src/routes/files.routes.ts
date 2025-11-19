import { Router } from 'express';
import multer from 'multer';
import { uploadFile, getSignedUrl, deleteFile } from '../controllers/files.controller';
import { authenticate } from '../middleware/auth';
import { storageService } from '../services/storage';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    }
    
    try {
      storageService.validateFile(req.file);
      return next();
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
  },
  uploadFile
);

router.get('/signed-url/:key', authenticate, getSignedUrl);
router.delete('/:key', authenticate, deleteFile);

export default router;


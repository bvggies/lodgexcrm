import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '../middleware/errorHandler';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export class StorageService {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    const storageType = process.env.STORAGE_TYPE || 's3';
    const region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || 'lodgexcrm-uploads';

    const config: AWS.S3.ClientConfiguration = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region,
    };

    // Support for DigitalOcean Spaces or other S3-compatible services
    if (process.env.AWS_S3_ENDPOINT) {
      config.endpoint = process.env.AWS_S3_ENDPOINT;
      config.s3ForcePathStyle = true;
    }

    this.s3 = new AWS.S3(config);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<UploadResult> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const key = `${folder}/${uuidv4()}.${fileExtension}`;

      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private', // Files are private by default
      };

      await this.s3.upload(params).promise();

      // Generate signed URL (valid for 1 hour by default)
      const url = this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: 3600,
      });

      return {
        url,
        key,
        bucket: this.bucket,
      };
    } catch (error: any) {
      throw createError(`File upload failed: ${error.message}`, 500);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      return this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      });
    } catch (error: any) {
      throw createError(`Failed to generate signed URL: ${error.message}`, 500);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key,
      }).promise();
    } catch (error: any) {
      throw createError(`File deletion failed: ${error.message}`, 500);
    }
  }

  validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (file.size > maxSize) {
      throw createError('File size exceeds 10MB limit', 400);
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw createError(
        `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
        400
      );
    }
  }
}

export const storageService = new StorageService();


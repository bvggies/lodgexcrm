import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { StaffRole } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: StaffRole;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, secret) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.verify(token, secret) as JWTPayload;
};


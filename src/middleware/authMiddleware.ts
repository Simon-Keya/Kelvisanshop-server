// src/middleware/authMiddleware.ts

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
      };
    }
  }
}

interface JwtPayload {
  userId: number;
  role: string;
}

/**
 * JWT authentication
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('No token provided', { path: req.path });
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  if (!config.JWT_SECRET) {
    logger.error('JWT_SECRET missing');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    logger.warn('Invalid token', { error: err.message });
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Admin-only guard
 */
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn('Admin access denied', {
      userId: req.user?.userId,
      role: req.user?.role,
      path: req.path,
    });
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

export { authenticateToken as authMiddleware };

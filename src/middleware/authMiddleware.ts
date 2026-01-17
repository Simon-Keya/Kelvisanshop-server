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
 * Authenticate JWT
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Invalid token');
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
  if (req.user?.role !== 'admin') {
    logger.warn('Admin access denied', {
      userId: req.user?.userId,
      role: req.user?.role,
    });
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export { authenticateToken as authMiddleware };

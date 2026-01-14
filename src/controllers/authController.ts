import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { check } from 'express-validator';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import logger from '../utils/logger';
import prisma from '../utils/prisma';

/**
 * =============================
 * VALIDATION RULES
 * =============================
 * NOTE:
 * - Role is NOT accepted from client
 * - Role is enforced server-side
 */

export const validateRegister = [
  check('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),

  check('email')
    .normalizeEmail()
    .isEmail()
    .withMessage('Valid email is required'),

  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const validateLogin = [
  check('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),

  check('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * =============================
 * REGISTER
 * =============================
 */
export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email';
      logger.warn(`${field} already taken`, { username, email });
      return res.status(400).json({ error: `${field} already taken` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'user', // 🔒 enforced server-side
      },
    });

    logger.info('User registered successfully', { username, email });

    return res.status(201).json({
      message: 'Registration successful',
    });
  } catch (error: any) {
    // Prisma unique constraint safety
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Username or email already exists',
      });
    }

    logger.error('Error registering user', { error });
    return res.status(500).json({
      error: 'Failed to register user',
    });
  }
};

/**
 * ==========================
 * LOGIN
 * ==========================
 */
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!config.JWT_SECRET) {
      logger.error('JWT_SECRET missing');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('User logged in', { userId: user.id });

    return res.status(200).json({ token });
  } catch (error) {
    logger.error('Login error', { error });
    return res.status(500).json({ error: 'Login failed' });
  }
};

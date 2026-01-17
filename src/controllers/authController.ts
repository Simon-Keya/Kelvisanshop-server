import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { check } from 'express-validator';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import logger from '../utils/logger';
import prisma from '../utils/prisma';

/**
 * =============================
 * VALIDATION
 * =============================
 */
export const validateRegister = [
  check('username').trim().isLength({ min: 3 }),
  check('email').normalizeEmail().isEmail(),
  check('password').isLength({ min: 6 }),
];

export const validateLogin = [
  check('username').trim().notEmpty(),
  check('password').notEmpty(),
];

/**
 * =============================
 * REGISTER (USERS ONLY)
 * =============================
 */
export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'user', // 🔒 enforced
      },
    });

    logger.info('User registered', { username });

    return res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    logger.error('Registration failed', { error });
    return res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * =============================
 * LOGIN (USER + ADMIN)
 * =============================
 */
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    logger.info('Login successful', {
      userId: user.id,
      role: user.role,
    });

    return res.status(200).json({
      token,
      role: user.role,
    });
  } catch (error) {
    logger.error('Login failed', { error });
    return res.status(500).json({ error: 'Login failed' });
  }
};

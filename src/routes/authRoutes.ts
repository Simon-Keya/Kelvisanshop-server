import { Router } from 'express';
import {
  login,
  register,
  validateLogin,
  validateRegister,
} from '../controllers/authController';
import { validate } from '../middleware/validateMiddleware';

export const authRouter = () => {
  const router = Router();

  router.post('/register', validateRegister, validate, register);
  router.post('/login', validateLogin, validate, login);

  return router;
};

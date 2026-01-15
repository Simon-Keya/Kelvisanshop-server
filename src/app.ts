import cors from 'cors';
import express, { Application } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { errorMiddleware } from './middleware/errorMiddleware';
import { rateLimiter } from './middleware/rateLimitMiddleware';

// ROUTES
import { authRouter } from './routes/authRoutes';
import cartRouter from './routes/cartRoutes';
import orderRouter from './routes/orderRoutes';
import reviewRouter from './routes/reviewRoutes';

const app: Application = express();

/**
 * ======================
 * GLOBAL MIDDLEWARE
 * ======================
 */
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://kelvisanshop.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

/**
 * ======================
 * STATIC FILES
 * ======================
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * ======================
 * HEALTH CHECK
 * ======================
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * ======================
 * API ROUTES
 * ======================
 */
app.use('/api/auth', authRouter());
app.use('/api/cart', cartRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/orders', orderRouter);

/**
 * ======================
 * SWAGGER
 * ======================
 */
if (process.env.NODE_ENV !== 'production') {
  try {
    const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (err) {
    console.warn('Swagger docs not loaded:', err);
  }
}

/**
 * ======================
 * ERROR HANDLER (LAST)
 * ======================
 */
app.use(errorMiddleware);

export default app;

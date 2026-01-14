import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initializeDatabase } from './models/db';
import { initSocket } from './sockets/socketHandler';
import { config } from './utils/config';
import logger from './utils/logger';

// Socket-only routes
import initializeProductRoutes from './routes/productRoutes';
import { categoryRouter } from './routes/categoryRoutes';

dotenv.config();

const startServer = async () => {
  try {
    await initializeDatabase();
    logger.info('Database connected successfully');

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin:
          process.env.NODE_ENV === 'production'
            ? ['https://kelvisanshop.vercel.app']
            : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    initSocket(io);

    // Socket-dependent routes ONLY
    app.use('/api/products', initializeProductRoutes(io));
    app.use('/api/categories', categoryRouter(io));

    server.listen(config.PORT, () => {
      logger.info(`Server running on http://localhost:${config.PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

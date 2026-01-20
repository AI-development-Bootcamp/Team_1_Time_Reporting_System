import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/ErrorHandler';
import authRoutes from './routes/auth.routes';
import adminUsersRoutes from './routes/admin/Users';
import assignmentsRoutes from './routes/admin/Assignments';

/**
 * Create and configure Express app
 * This is exported for testing purposes
 */
export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminUsersRoutes);
  app.use('/api/admin', assignmentsRoutes);

  // Error handler must be last
  app.use(errorHandler);

  return app;
};

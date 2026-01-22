import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/ErrorHandler';
import authRoutes from './routes/auth.routes';
import adminUsersRoutes from './routes/admin/Users';
import assignmentsRoutes from './routes/admin/Assignments';
import attendanceRoutes from './routes/attendance.routes';
import timeLogsRoutes from './routes/timeLogs.routes';
import projectsRoutes from './routes/projects.routes';


/**
 * Create and configure Express app
 * This is exported for testing purposes
 */


export const createApp = () => {
  const app = express();

  // Parse CORS origins from environment variables
  const localOrigins = process.env.LOCAL_CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || [];
  const deployOrigins = process.env.DEPLOY_CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || [];
  const corsOrigins = [...localOrigins, ...deployOrigins];

  // In non-development/non-test environments, require explicit CORS origins
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  if (!isDevOrTest && corsOrigins.length === 0) {
    throw new Error(
      'CORS origins must be configured in non-development environments. ' +
      'Set LOCAL_CORS_ORIGINS and/or DEPLOY_CORS_ORIGINS environment variables.'
    );
  }

  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : true, // Allow all only in development
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminUsersRoutes);
  app.use('/api/admin', assignmentsRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/time-logs', timeLogsRoutes);
  app.use('/api/projects', projectsRoutes);

  // Error handler must be last
  app.use(errorHandler);

  return app;
};

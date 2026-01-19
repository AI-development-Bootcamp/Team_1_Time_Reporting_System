import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/ErrorHandler';
import { initializeDatabaseConfig } from './utils/DatabaseConfig';

dotenv.config();

// Initialize database config with port fallback BEFORE importing routes (which use PrismaClient)
const startServer = async () => {
  try {
    await initializeDatabaseConfig();
    console.log('✅ Database configuration initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database config:', error);
    process.exit(1);
  }

  // Import routes AFTER database config is initialized
  const authRoutes = (await import('./routes/Auth')).default;

  const app = express();
  const port = process.env.PORT || 10000;

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);

  // Error handler must be last
  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();

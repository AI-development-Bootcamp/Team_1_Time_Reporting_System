import dotenv from 'dotenv';
import { initializeDatabaseConfig } from './utils/DatabaseConfig';
import { createApp } from './app';

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

  const app = createApp();
  const port = process.env.PORT || 10000;

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();

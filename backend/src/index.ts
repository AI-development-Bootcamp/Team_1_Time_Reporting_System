import dotenv from 'dotenv';
import { initializeDatabaseConfig } from './utils/DatabaseConfig';
// Initialize database config with port fallback BEFORE importing routes (which use PrismaClient)
const startServer = async () => {
  try {
    await initializeDatabaseConfig();
    console.log('✅ Database configuration initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database config:', error);
    process.exit(1);
  }

  // Import app after DB config is initialized
  const { createApp } = await import('./app');
  const app = createApp();
  const port = process.env.PORT || 10000;

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();

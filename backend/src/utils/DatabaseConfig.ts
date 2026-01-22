import dotenv from 'dotenv';

dotenv.config();

/**
 * Parse DATABASE_URL and extract port for logging
 */
const parseDatabaseUrl = (url: string): { port: number } => {
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?$/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  const portStr = match[4];
  const port = parseInt(portStr, 10);

  return { port };
};

/**
 * Initialize database configuration
 * Reads DATABASE_URL from .env (set by setup script)
 * The setup script handles port selection and saves it to .env
 */
export const initializeDatabaseConfig = async (): Promise<string> => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Please run "npm run setup" first.');
  }

  try {
    const { port } = parseDatabaseUrl(databaseUrl);
    console.log(`✅ Database configured on port ${port} (from .env)`);
  } catch (error) {
    console.warn(`⚠️  Could not parse DATABASE_URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return databaseUrl;
};

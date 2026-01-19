import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client instance
 * Use this instance throughout the application to avoid multiple connections
 */
export const prisma = new PrismaClient();

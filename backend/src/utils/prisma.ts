import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client instance
 * Prevents connection pool exhaustion and memory leaks by reusing a single instance
 * across all route handlers instead of creating new instances in each router
 */
export const prisma = new PrismaClient();


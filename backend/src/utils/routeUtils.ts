import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Wrapper to catch async errors and forward them to the error handler middleware
 * Prevents unhandled promise rejections in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Zod schema for BigInt IDs that accepts both string and number
 * Converts the value to BigInt for database operations
 * This is necessary because JavaScript Number can only safely represent integers up to 2^53,
 * but PostgreSQL BigInt can store much larger values. The frontend may send BigInt IDs as strings.
 */
export const bigIntIdSchema = z
  .union([z.string().regex(/^\d+$/, 'ID must be a valid number'), z.number().int().positive()])
  .transform((val) => BigInt(val));

/**
 * Zod schema for optional BigInt IDs that accepts both string and number
 */
export const optionalBigIntIdSchema = bigIntIdSchema.optional();

/**
 * Serializes data to make it JSON-safe
 * Converts BigInt values to strings and Date objects to ISO strings
 * Handles nested objects and arrays recursively
 */
export function serializeData<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeData(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeData(value);
    }
    return result;
  }

  return obj;
}


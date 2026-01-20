import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/Response';
import { ZodError } from 'zod';

export interface ErrorDetails {
  target?: string;
  details?: unknown;
  [key: string]: unknown;
}

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: ErrorDetails | unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    ApiResponse.error(
      res,
      'VALIDATION_ERROR',
      'Validation failed',
      400,
      err.errors
    );
    return;
  }

  // Custom application errors
  if (err instanceof AppError) {
    // Handle structured errors with target field
    let target: string | undefined;
    let details: ErrorDetails | unknown = err.details;

    if (details && typeof details === 'object' && 'target' in details) {
      target = (details as ErrorDetails).target;
      details = (details as ErrorDetails).details || details;
    }

    ApiResponse.error(
      res,
      err.code,
      err.message,
      err.statusCode,
      details,
      target
    );
    return;
  }

  // Unknown errors
  console.error('Unhandled error:', err);
  ApiResponse.error(
    res,
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    500
  );
};

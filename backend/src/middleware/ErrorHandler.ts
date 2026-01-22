import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorDetails } from '../utils/Response';
import { ZodError } from 'zod';

export interface AppErrorDetails {
  target?: string;
  details?: unknown;
  [key: string]: unknown;
}

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: AppErrorDetails | unknown
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
    let details: AppErrorDetails | unknown = err.details;

    if (details && typeof details === 'object' && 'target' in details) {
      target = (details as AppErrorDetails).target;
      details = (details as AppErrorDetails).details || details;
    }

    ApiResponse.error(
      res,
      err.code,
      err.message,
      err.statusCode,
      details as ErrorDetails,
      target
    );
    return;
  }

  // Unknown errors
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  console.error('Error message:', err.message);
  console.error('Error name:', err.name);
  
  // Include error details in response for debugging (in development)
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  ApiResponse.error(
    res,
    'INTERNAL_ERROR',
    isDevelopment ? `An unexpected error occurred: ${err.message}` : 'An unexpected error occurred',
    500,
    isDevelopment ? { stack: err.stack, name: err.name } : undefined
  );
};


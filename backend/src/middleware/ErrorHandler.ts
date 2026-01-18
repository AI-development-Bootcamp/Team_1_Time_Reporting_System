import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/Response';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: any
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
    ApiResponse.error(
      res,
      err.code,
      err.message,
      err.statusCode,
      err.details
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

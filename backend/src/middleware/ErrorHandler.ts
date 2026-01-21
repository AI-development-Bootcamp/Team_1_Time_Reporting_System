import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/Response';
import { ZodError } from 'zod';
import multer from 'multer';

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
  // Multer errors (file upload)
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds maximum limit of 5MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field in upload';
        break;
      default:
        message = err.message;
    }
    
    ApiResponse.error(
      res,
      'FILE_UPLOAD_ERROR',
      message,
      400
    );
    return;
  }

  // File validation errors from multer fileFilter
  if (err instanceof Error && (
    err.message.includes('Invalid file type') || 
    err.message.includes('Invalid file extension')
  )) {
    ApiResponse.error(
      res,
      'VALIDATION_ERROR',
      err.message,
      400
    );
    return;
  }

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

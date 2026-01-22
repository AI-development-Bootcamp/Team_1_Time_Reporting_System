import { Response } from 'express';
import { ZodIssue } from 'zod';

/**
 * Validation error detail structure
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * Error details can be validation errors, Zod issues, or other structured error info
 */
export type ErrorDetails =
  | ValidationErrorDetail[]
  | ZodIssue[]
  | Record<string, string[]>
  | Record<string, unknown>
  | unknown[];

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    target?: string;
    details?: ErrorDetails;
  };
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode: number = 200): void {
    // For 204 No Content, send empty response body (REST convention)
    if (statusCode === 204) {
      res.status(204).send();
      return;
    }

    const response: SuccessResponse<T> = {
      success: true,
      data,
    };
    res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 400,
    details?: ErrorDetails,
    target?: string
  ): void {
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(target && { target }),
        ...(details && { details }),
      },
    };
    res.status(statusCode).json(response);
  }
}


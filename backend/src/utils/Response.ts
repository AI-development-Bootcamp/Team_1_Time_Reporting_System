import { Response } from 'express';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode: number = 200): void {
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
    details?: any
  ): void {
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    };
    res.status(statusCode).json(response);
  }
}

import { AppError } from '../middleware/ErrorHandler';

/**
 * Safely parse a string parameter to BigInt
 * Throws AppError with 400 status if the value is not a valid positive integer
 *
 * @param value - The string value to parse
 * @param paramName - The parameter name (for error messages)
 * @returns The parsed BigInt value
 * @throws AppError if the value is not a valid positive integer
 */
export function parseBigIntParam(value: string, paramName: string = 'id'): bigint {
  if (!/^\d+$/.test(value)) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Invalid ${paramName}: must be a positive integer`,
      400
    );
  }
  return BigInt(value);
}

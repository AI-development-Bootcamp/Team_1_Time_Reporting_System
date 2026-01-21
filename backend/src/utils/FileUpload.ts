import multer from 'multer';
import { AppError } from '../middleware/ErrorHandler';

// ============================================================================
// Constants
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
] as const;

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'] as const;

// ============================================================================
// File Validation
// ============================================================================

/**
 * Validate file type (MIME type and extension)
 */
function validateFileType(file: Express.Multer.File): void {
  const mimeType = file.mimetype.toLowerCase();
  const originalName = file.originalname.toLowerCase();
  
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Invalid file type. Allowed types: JPG, PNG, PDF (received: ${file.mimetype})`,
      400
    );
  }
  
  // Check file extension
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => originalName.endsWith(ext));
  if (!hasValidExtension) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
      400
    );
  }
}

/**
 * Validate file size
 */
function validateFileSize(file: Express.Multer.File): void {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new AppError(
      'VALIDATION_ERROR',
      `File size exceeds maximum limit of 5MB (received: ${sizeMB}MB)`,
      400
    );
  }
}

/**
 * Validate uploaded file (type and size)
 */
export function validateUploadedFile(file: Express.Multer.File | undefined): void {
  if (!file) {
    throw new AppError('VALIDATION_ERROR', 'No file uploaded', 400);
  }
  
  validateFileType(file);
  validateFileSize(file);
}

// ============================================================================
// Multer Configuration
// ============================================================================

/**
 * Multer configuration for document upload
 * Stores file in memory as Buffer for database storage
 */
export const documentUpload = multer({
  storage: multer.memoryStorage(), // Store in memory for BYTEA storage
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only allow single file upload
  },
  fileFilter: (req, file, callback) => {
    const mimeType = file.mimetype.toLowerCase();
    const originalName = file.originalname.toLowerCase();
    
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
      return callback(
        new Error(`Invalid file type. Allowed types: JPG, PNG, PDF (received: ${file.mimetype})`)
      );
    }
    
    // Check file extension
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => originalName.endsWith(ext));
    if (!hasValidExtension) {
      return callback(
        new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`)
      );
    }
    
    callback(null, true); // Accept file
  },
});

// ============================================================================
// Exports
// ============================================================================

export const FILE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
} as const;

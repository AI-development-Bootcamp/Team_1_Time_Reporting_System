/**
 * FileUpload Component
 * Drag & drop file upload with validation
 * 
 * Features:
 * - Drag & drop zone
 * - Click to upload
 * - File type validation (JPG, PNG, PDF)
 * - File size validation (max 5MB)
 * - Display uploaded file with badge and delete option
 * - Mobile-first, RTL design
 */

import { useRef, useState } from 'react';
import { Text, Button, Group, Badge } from '@mantine/core';
import { IconFolder, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import classes from './FileUpload.module.css';

interface FileUploadProps {
  /** Currently uploaded file */
  file: File | null;
  /** Callback when file is selected/uploaded */
  onUpload: (file: File) => void;
  /** Callback when file is deleted */
  onDelete: () => void;
}

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

/**
 * Get file extension badge text
 */
function getFileBadge(file: File): string {
  const extension = file.name.split('.').pop()?.toUpperCase() || '';
  if (extension === 'JPEG') return 'JPG';
  return extension;
}

/**
 * Validate file type and size
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'סוג קובץ לא נתמך. השתמש ב-JPG, PNG או PDF בלבד',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `גודל הקובץ חורג מהמותר (מקסימום 5MB)`,
    };
  }

  return { valid: true };
}

/**
 * FileUpload - Drag & drop file uploader
 * 
 * @example
 * <FileUpload
 *   file={uploadedFile}
 *   onUpload={(file) => setUploadedFile(file)}
 *   onDelete={() => setUploadedFile(null)}
 * />
 */
export function FileUpload({
  file,
  onUpload,
  onDelete,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    const validation = validateFile(selectedFile);
    
    if (!validation.valid) {
      notifications.show({
        title: 'שגיאה',
        message: validation.error || 'קובץ לא תקין',
        color: 'red',
        autoClose: 4000,
      });
      return;
    }

    onUpload(selectedFile);
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  // Handle click to upload
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles[0]);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle delete
  const handleDelete = () => {
    onDelete();
  };

  // If file is uploaded, show file info
  if (file) {
    return (
      <div className={classes.uploadedContainer}>
        <Group justify="space-between" align="center">
          <div className={classes.fileInfo}>
            <Text size="sm" fw={500}>
              {file.name}
            </Text>
            <Badge variant="light" color="blue" size="sm" mt="xs">
              {getFileBadge(file)}
            </Badge>
          </div>
          <Button
            variant="subtle"
            color="red"
            size="xs"
            onClick={handleDelete}
            className={classes.deleteButton}
          >
            <IconX size={16} />
          </Button>
        </Group>
      </div>
    );
  }

  // Show upload zone
  return (
    <div
      className={`${classes.dropZone} ${isDragging ? classes.dragging : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileInputChange}
        className={classes.hiddenInput}
      />

      {/* Upload Icon */}
      <IconFolder size={48} className={classes.icon} />

      {/* Upload Text */}
      <Text size="sm" fw={500} c="blue" className={classes.uploadLink}>
        לחץ כאן להעלאת הקובץ
      </Text>

      {/* Accepted Formats */}
      <Text size="xs" c="dimmed" mt="xs">
        JPG / PNG / PDF
      </Text>
      <Text size="xs" c="dimmed">
        (מקסימום 5MB)
      </Text>
    </div>
  );
}

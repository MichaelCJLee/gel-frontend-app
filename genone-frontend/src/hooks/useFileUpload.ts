import { useState, useCallback } from 'react'

// File size limits (in bytes)
const SIZE_LIMITS = {
  'text/plain': 1 * 1024 * 1024, // 1MB
  'application/pdf': 5 * 1024 * 1024, // 5MB
  'image/jpeg': 5 * 1024 * 1024, // 5MB
  'image/jpg': 5 * 1024 * 1024, // 5MB
  'image/png': 5 * 1024 * 1024, // 5MB
  'image/gif': 5 * 1024 * 1024 // 5MB
} as const

const MAX_TOTAL_SIZE = 15 * 1024 * 1024 // 15MB

// Supported file types
const SUPPORTED_TYPES = {
  'text/plain': true,
  'application/pdf': true,
  'image/jpeg': true,
  'image/jpg': true,
  'image/png': true,
  'image/gif': true
} as const

export interface UseFileUploadOptions {
  maxFiles?: number
  onError?: (errors: string[]) => void
  onSuccess?: (files: File[]) => void
  onWarning?: (warnings: string[]) => void
}

export interface UseFileUploadReturn {
  selectedFiles: File[]
  addFiles: (files: FileList | File[]) => boolean
  removeFile: (index: number) => void
  clearFiles: () => void
  validateFiles: (files: FileList | File[]) => string[]
  isAtLimit: boolean
  totalSize: number
  formatFileSize: (bytes: number) => string
  canAddMoreFiles: boolean
  remainingSlots: number
}

/**
 * Custom hook for handling file upload with validation
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { maxFiles = 3, onError, onSuccess, onWarning } = options
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  /**
   * Format file size in human readable format
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  /**
   * Validate a single file
   */
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES]) {
      return `Unsupported file type: ${file.type}. Supported types: .txt, .pdf, .jpg, .png, .gif`
    }

    // Check file size
    const sizeLimit = SIZE_LIMITS[file.type as keyof typeof SIZE_LIMITS]
    if (file.size > sizeLimit) {
      return `File too large: ${formatFileSize(file.size)}. Max size for ${file.type}: ${formatFileSize(sizeLimit)}`
    }

    return null
  }, [formatFileSize])

  /**
   * Validate multiple files
   */
  const validateFiles = useCallback((files: FileList | File[]): string[] => {
    const filesArray = Array.from(files)
    const errors: string[] = []

    // Validate each file individually
    for (const file of filesArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      }
    }

    // Check total file count
    const totalFiles = selectedFiles.length + filesArray.length
    if (totalFiles > maxFiles) {
      errors.push(`Too many files. Maximum ${maxFiles} files allowed.`)
    }

    // Check total size (including existing files)
    const newTotalSize = [...selectedFiles, ...filesArray].reduce((sum, file) => sum + file.size, 0)
    if (newTotalSize > MAX_TOTAL_SIZE) {
      errors.push(`Total file size too large: ${formatFileSize(newTotalSize)}. Maximum: ${formatFileSize(MAX_TOTAL_SIZE)}`)
    }

    return errors
  }, [selectedFiles, maxFiles, validateFile, formatFileSize])

  /**
   * Add files with validation
   */
  const addFiles = useCallback((files: FileList | File[]): boolean => {
    const filesArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []
    const warnings: string[] = []

    // Validate each file
    for (const file of filesArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)

        // Add warnings for specific file types
        if (file.type === 'application/pdf') {
          warnings.push(`PDF Warning: Only text-based PDFs are supported. Image-based or scanned PDFs may not be processed correctly.`)
        }
      }
    }

    // Check total file count
    const totalFiles = selectedFiles.length + validFiles.length
    if (totalFiles > maxFiles) {
      errors.push(`Too many files. Maximum ${maxFiles} files allowed.`)
      onError?.(errors)
      return false
    }

    // Check total size
    const newTotalSize = [...selectedFiles, ...validFiles].reduce((sum, file) => sum + file.size, 0)
    if (newTotalSize > MAX_TOTAL_SIZE) {
      errors.push(`Total file size too large: ${formatFileSize(newTotalSize)}. Maximum: ${formatFileSize(MAX_TOTAL_SIZE)}`)
      onError?.(errors)
      return false
    }

    if (errors.length > 0) {
      onError?.(errors)
      return false
    }

    // Show warnings if any
    if (warnings.length > 0) {
      onWarning?.(warnings)
    }

    // Add valid files
    const updatedFiles = [...selectedFiles, ...validFiles]
    setSelectedFiles(updatedFiles)
    onSuccess?.(updatedFiles)
    return true
  }, [selectedFiles, maxFiles, validateFile, formatFileSize, onError, onSuccess, onWarning])

  /**
   * Remove file by index
   */
  const removeFile = useCallback((index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updatedFiles)
    onSuccess?.(updatedFiles)
  }, [selectedFiles, onSuccess])

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setSelectedFiles([])
    onSuccess?.([])
  }, [onSuccess])

  // Computed values
  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
  const isAtLimit = selectedFiles.length >= maxFiles
  const canAddMoreFiles = selectedFiles.length < maxFiles
  const remainingSlots = maxFiles - selectedFiles.length

  return {
    selectedFiles,
    addFiles,
    removeFile,
    clearFiles,
    validateFiles,
    isAtLimit,
    totalSize,
    formatFileSize,
    canAddMoreFiles,
    remainingSlots
  }
}

// Export constants for external use
export { SIZE_LIMITS, MAX_TOTAL_SIZE, SUPPORTED_TYPES }

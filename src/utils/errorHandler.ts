import { NextApiResponse } from 'next'
import { HTTP } from './constants'

/**
 * Error codes used throughout the application
 */
export enum ErrorCode {
  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FOLDER_NOT_FOUND = 'FOLDER_NOT_FOUND',
  NOT_A_FILE = 'NOT_A_FILE',
  NOT_A_FOLDER = 'NOT_A_FOLDER',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  
  // Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',
  
  // Request errors
  INVALID_PATH = 'INVALID_PATH',
  INVALID_PARAMS = 'INVALID_PARAMS',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  STREAMING_ERROR = 'STREAMING_ERROR',
}

/**
 * Custom error class for application
 */
export class AppError extends Error {
  code: ErrorCode
  status: number
  shouldLog: boolean
  
  constructor(code: ErrorCode, message: string, status = 500, shouldLog = true) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.shouldLog = shouldLog
    
    // Maintain proper stack trace for debugging (only in V8 engine)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

/**
 * Create standard file system errors
 */
export const createFileSystemError = {
  fileNotFound: (path?: string, shouldLog = true) => new AppError(
    ErrorCode.FILE_NOT_FOUND,
    `File not found${path ? `: ${path}` : ''}`,
    404,
    shouldLog
  ),
  
  folderNotFound: (path?: string) => new AppError(
    ErrorCode.FOLDER_NOT_FOUND,
    `Folder not found${path ? `: ${path}` : ''}`,
    404,
    true
  ),
  
  notAFile: (path?: string) => new AppError(
    ErrorCode.NOT_A_FILE,
    `Resource is not a file${path ? `: ${path}` : ''}`,
    400,
    true
  ),
  
  notAFolder: (path?: string) => new AppError(
    ErrorCode.NOT_A_FOLDER,
    `Resource is not a folder${path ? `: ${path}` : ''}`,
    400,
    true
  ),
  
  itemNotFound: (path?: string) => new AppError(
    ErrorCode.ITEM_NOT_FOUND,
    `Item not found${path ? `: ${path}` : ''}`,
    404,
    true
  ),
}

/**
 * Create standard authorization errors
 */
export const createAuthError = {
  unauthorized: (message = 'Unauthorized') => new AppError(
    ErrorCode.UNAUTHORIZED,
    message,
    401,
    true
  ),
  
  passwordRequired: () => new AppError(
    ErrorCode.PASSWORD_REQUIRED,
    'Password required',
    401,
    false
  ),
}

/**
 * Create standard request errors
 */
export const createRequestError = {
  invalidPath: (message = 'Invalid path') => new AppError(
    ErrorCode.INVALID_PATH,
    message,
    400,
    true
  ),
  
  invalidParams: (message = 'Invalid parameters') => new AppError(
    ErrorCode.INVALID_PARAMS,
    message,
    400,
    true
  ),
}

/**
 * Create standard server errors
 */
export const createServerError = {
  internal: (message = 'Internal server error') => new AppError(
    ErrorCode.INTERNAL_ERROR,
    message,
    500,
    true
  ),
  
  streaming: (message = 'Streaming error') => new AppError(
    ErrorCode.STREAMING_ERROR,
    message,
    500,
    true
  ),
}

/**
 * Handle API errors consistently
 * @param error Error object
 * @param res Next.js response object
 * @param context Additional context for logging
 */
export function handleApiError(error: any, res: NextApiResponse, context = ''): void {
  // Handle our custom AppError
  if (error instanceof AppError) {
    if (error.shouldLog) {
      console.error(`API Error [${error.code}]${context ? ` - ${context}` : ''}:`, error.message)
    }
    res.status(error.status).json({ error: error.message, code: error.code })
    return
  }
  
  // Handle standard Error
  console.error(`Unhandled API Error${context ? ` - ${context}` : ''}:`, error)
  res.status(HTTP.STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR })
}

/**
 * Wrap an async function with error handling
 * @param fn Async function to wrap
 * @param defaultError Default error message
 * @returns Wrapped function
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  defaultError = 'An error occurred'
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args)
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error
      }
      const errorMessage = error instanceof Error ? error.message : defaultError
      throw createServerError.internal(errorMessage)
    }
  }
} 
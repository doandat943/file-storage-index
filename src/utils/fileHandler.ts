import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { Readable } from 'stream'
import apiConfig from '../../config/api.config'
import { 
  createFileSystemError, 
  AppError, 
  withErrorHandling,
} from './errorHandler'
import { getMimeType } from './mimeTypes'
import { FILE_SYSTEM, MEDIA_TYPE } from './constants'
import { FileObject, FolderObject } from '../types'

// Promisify FS functions
const fsReaddir = promisify(fs.readdir)
const fsStat = promisify(fs.stat)
const fsReadFile = promisify(fs.readFile)
const fsExists = promisify(fs.exists)
const fsWriteFile = promisify(fs.writeFile)
const fsMkdir = promisify(fs.mkdir)
const fsUnlink = promisify(fs.unlink)
const fsRmdir = promisify(fs.rmdir)

// Get the absolute path to the file storage folder
const fileStorageDir = path.resolve(process.cwd(), apiConfig.storageConfig.fileDirectory)

/**
 * Resolve a relative path to the absolute path in the file system
 * @param relativePath Relative path to resolve
 * @returns Absolute path
 */
export function resolveFilePath(relativePath: string): string {
  // Normalize and resolve the path
  let cleanPath = path.normalize(relativePath).replace(/^\/+/, '')
  return path.join(fileStorageDir, cleanPath)
}

/**
 * Interface for file information
 */
export interface FileInfo {
  path: string
  name: string
  size: number
  mimeType: string
  isDirectory: boolean
  modifiedTime: Date
}

/**
 * Options for stream file content
 */
export interface StreamOptions {
  start?: number
  end?: number
}

/**
 * Stream file result
 */
export interface StreamResult {
  stream: Readable
  size: number
  mimeType: string
  isRangeRequest: boolean
}

/**
 * Main file handler class
 */
export class FileHandler {
  /**
   * Ensure the storage folder exists
   */
  static async ensureStorageFolder(): Promise<void> {
    if (!fs.existsSync(fileStorageDir)) {
      await fsMkdir(fileStorageDir, { recursive: true })
    }
  }

  /**
   * Convert file info to FileObject format (compatible with existing API)
   * @param filePath Relative path to file
   * @param stats File stats
   * @param fileName File name
   * @returns FileObject
   */
  static toFileObject(filePath: string, stats: fs.Stats, fileName: string): FileObject {
    const mimeType = getMimeType(fileName)
    
    // Create FileObject
    const result: FileObject = {
      name: fileName,
      size: stats.size,
      id: Buffer.from(filePath).toString('base64'),
      path: filePath,
      lastModifiedDateTime: stats.mtime.toISOString(),
      file: {
        mimeType
      }
    }
    
    // Add image info if it's an image
    if (mimeType.startsWith('image/')) {
      result.image = {}
    }
    
    // Add video info if it's a video
    if (mimeType.startsWith('video/')) {
      result.video = {
        width: 0,
        height: 0,
        duration: 0
      }
    }
    
    return result
  }
  
  /**
   * Get file information
   * @param relativePath Relative path to the file
   * @returns File information
   */
  static getFileInfo = withErrorHandling(async (relativePath: string): Promise<FileInfo> => {
    const absolutePath = resolveFilePath(relativePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw createFileSystemError.fileNotFound(relativePath)
    }
    
    const stats = await fsStat(absolutePath)
    const fileName = path.basename(relativePath)
    
    return {
      path: relativePath,
      name: fileName,
      size: stats.size,
      mimeType: getMimeType(fileName),
      isDirectory: stats.isDirectory(),
      modifiedTime: stats.mtime,
    }
  }, 'Failed to get file information')
  
  /**
   * Get file information in FileObject format (compatible with existing API)
   * @param filePath Relative path to the file
   * @returns FileObject
   */
  static getFileObjectInfo = withErrorHandling(async (filePath: string): Promise<FileObject> => {
    const absolutePath = resolveFilePath(filePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw createFileSystemError.fileNotFound(filePath)
    }
    
    const stats = await fsStat(absolutePath)
    
    if (stats.isDirectory()) {
      throw createFileSystemError.notAFile(filePath)
    }
    
    return this.toFileObject(filePath, stats, path.basename(filePath))
  }, 'Failed to get file info')
  
  /**
   * Check if path exists and is a file
   * @param relativePath Relative path to check
   * @throws AppError if path doesn't exist or is not a file
   */
  static async validateFile(relativePath: string): Promise<void> {
    const fileInfo = await this.getFileInfo(relativePath)
    
    if (fileInfo.isDirectory) {
      throw createFileSystemError.notAFile(relativePath)
    }
  }
  
  /**
   * Check if path exists and is a folder
   * @param relativePath Relative path to check
   * @throws AppError if path doesn't exist or is not a folder
   */
  static async validateFolder(relativePath: string): Promise<void> {
    const fileInfo = await this.getFileInfo(relativePath)
    
    if (!fileInfo.isDirectory) {
      throw createFileSystemError.notAFolder(relativePath)
    }
  }
  
  /**
   * Read file content
   * @param relativePath Relative path to the file
   * @returns File content as Buffer
   */
  static readFile = withErrorHandling(async (relativePath: string): Promise<Buffer> => {
    await this.validateFile(relativePath)
    const absolutePath = resolveFilePath(relativePath)
    return await fsReadFile(absolutePath)
  }, 'Failed to read file')
  
  /**
   * Stream file content with optional range support
   * @param relativePath Relative path to the file
   * @param options Stream options
   * @returns Stream result
   */
  static streamFile = withErrorHandling(async (relativePath: string, options?: StreamOptions): Promise<StreamResult> => {
    const absolutePath = resolveFilePath(relativePath)
    
    if (!fs.existsSync(absolutePath)) {
      throw createFileSystemError.fileNotFound(relativePath)
    }
    
    const stats = fs.statSync(absolutePath)
    
    if (stats.isDirectory()) {
      throw createFileSystemError.notAFile(relativePath)
    }
    
    const mimeType = getMimeType(path.basename(relativePath))
    
    // If range is specified, return a slice of the file
    if (options && (options.start !== undefined || options.end !== undefined)) {
      // Make sure range values are valid
      const start = Math.max(0, options.start || 0)
      const end = Math.min(stats.size - 1, options.end !== undefined ? options.end : stats.size - 1)
      
      const stream = fs.createReadStream(absolutePath, { start, end })
      return { 
        stream, 
        size: end - start + 1,
        mimeType,
        isRangeRequest: true
      }
    }
    
    // Return the whole file
    const stream = fs.createReadStream(absolutePath)
    return { 
      stream, 
      size: stats.size,
      mimeType,
      isRangeRequest: false
    }
  }, 'Failed to stream file')
  
  /**
   * Write file content
   * @param relativePath Relative path to the file
   * @param content File content
   */
  static writeFile = withErrorHandling(async (relativePath: string, content: string | NodeJS.ArrayBufferView): Promise<void> => {
    const absolutePath = resolveFilePath(relativePath)
    
    // Create parent directories if they don't exist
    const dir = path.dirname(absolutePath)
    if (!fs.existsSync(dir)) {
      await fsMkdir(dir, { recursive: true })
    }
    
    await fsWriteFile(absolutePath, content)
  }, 'Failed to write file')
  
  /**
   * Delete a file
   * @param relativePath Relative path to the file
   */
  static deleteFile = withErrorHandling(async (relativePath: string): Promise<void> => {
    await this.validateFile(relativePath)
    const absolutePath = resolveFilePath(relativePath)
    await fsUnlink(absolutePath)
  }, 'Failed to delete file')
  
  /**
   * List folder contents
   * @param relativePath Relative path to the folder
   * @returns Array of file information objects
   */
  static listFolder = withErrorHandling(async (relativePath: string): Promise<FileInfo[]> => {
    await this.validateFolder(relativePath)
    
    const absolutePath = resolveFilePath(relativePath)
    const files = await fsReaddir(absolutePath)
    
    const results = await Promise.all(files.map(async (file) => {
      const filePath = path.join(relativePath, file)
      return await this.getFileInfo(filePath)
    }))
    
    return results
  }, 'Failed to list folder')
  
  /**
   * Get folder contents in FolderObject format (compatible with existing API)
   * @param folderPath Relative path to the folder
   * @returns FolderObject with folder contents
   */
  static getFolderContents = withErrorHandling(async (folderPath: string): Promise<FolderObject> => {
    await this.validateFolder(folderPath)
    
    const absolutePath = resolveFilePath(folderPath)
    const files = await fsReaddir(absolutePath)
    
    const itemPromises = files.map(async (file) => {
      const filePath = path.join(absolutePath, file)
      const relativePath = path.join(folderPath, file)
      const stats = await fsStat(filePath)
      
      if (stats.isDirectory()) {
        // It's a folder
        const folderSize = await this.calculateFolderSize(relativePath)
        const childItems = await fsReaddir(filePath)
        
        return {
          id: Buffer.from(relativePath).toString('base64'),
          name: file,
          size: folderSize,
          lastModifiedDateTime: stats.mtime.toISOString(),
          folder: {
            childCount: childItems.length
          }
        }
      } else {
        // It's a file
        return this.toFileObject(relativePath, stats, file)
      }
    })
    
    const items = await Promise.all(itemPromises)
    
    return {
      path: folderPath,
      name: path.basename(folderPath) || 'Root',
      value: items
    }
  }, 'Failed to get folder contents')
  
  /**
   * Create a folder
   * @param relativePath Relative path to the folder
   */
  static createFolder = withErrorHandling(async (relativePath: string): Promise<void> => {
    const absolutePath = resolveFilePath(relativePath)
    await fsMkdir(absolutePath, { recursive: true })
  }, 'Failed to create folder')
  
  /**
   * Delete a folder
   * @param relativePath Relative path to the folder
   * @param recursive Whether to delete contents recursively
   */
  static deleteFolder = withErrorHandling(async (relativePath: string, recursive = true): Promise<void> => {
    await this.validateFolder(relativePath)
    
    const absolutePath = resolveFilePath(relativePath)
    
    if (recursive) {
      // Read folder contents
      const files = await fsReaddir(absolutePath)
      
      // Delete all files and subfolders
      for (const file of files) {
        const filePath = path.join(absolutePath, file)
        const stats = await fsStat(filePath)
        
        if (stats.isDirectory()) {
          await this.deleteFolder(path.join(relativePath, file), true)
        } else {
          await fsUnlink(filePath)
        }
      }
    }
    
    // Now delete the empty folder
    await fsRmdir(absolutePath)
  }, 'Failed to delete folder')
  
  /**
   * Calculate folder size
   * @param relativePath Relative path to the folder
   * @param recursive Whether to calculate size recursively
   * @returns Folder size in bytes
   */
  static calculateFolderSize = withErrorHandling(async (relativePath: string, recursive = false): Promise<number> => {
    const fileInfo = await this.getFileInfo(relativePath)
    
    if (!fileInfo.isDirectory) {
      return fileInfo.size
    }
    
    const absolutePath = resolveFilePath(relativePath)
    const files = await fsReaddir(absolutePath)
    
    if (files.length === 0) {
      return 0
    }
    
    let size = 0
    for (const file of files) {
      const filePath = path.join(absolutePath, file)
      const stats = await fsStat(filePath)
      
      if (stats.isDirectory()) {
        if (recursive) {
          size += await this.calculateFolderSize(path.join(relativePath, file), true)
        } else {
          // For directories, use nominal size when non-recursive
          size += FILE_SYSTEM.STANDARD_DIRECTORY_SIZE
        }
      } else {
        size += stats.size
      }
    }
    
    return size
  }, 'Failed to calculate folder size')
  
  /**
   * Get item by ID (used for direct file access by ID)
   * @param id Base64 encoded item ID
   * @returns Item information
   */
  static getItemById = withErrorHandling(async (id: string): Promise<{ id: string; name: string; parentReference: any }> => {
    // Decode the base64 ID to get the relative path
    const relativePath = Buffer.from(id, 'base64').toString('utf-8')
    const absolutePath = resolveFilePath(relativePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw createFileSystemError.itemNotFound(relativePath)
    }
    
    // Get the parent folder and file name
    const fileName = path.basename(relativePath)
    const parentDir = path.dirname(relativePath)
    
    return {
      id: id,
      name: fileName,
      parentReference: {
        path: `/drive/root:${parentDir === '.' ? '' : `/${parentDir}`}`,
        id: Buffer.from(parentDir).toString('base64'),
      }
    }
  }, 'Failed to get item by ID')
}

// Stream file content with direct return instead of Promise for compatibility
export function streamFileContent(relativePath: string, options?: StreamOptions): StreamResult {
  const absolutePath = resolveFilePath(relativePath)
  
  if (!fs.existsSync(absolutePath)) {
    throw createFileSystemError.fileNotFound(relativePath)
  }
  
  const stats = fs.statSync(absolutePath)
  
  if (stats.isDirectory()) {
    throw createFileSystemError.notAFile(relativePath)
  }
  
  const mimeType = getMimeType(path.basename(relativePath))
  
  // If range is specified, return a slice of the file
  if (options && (options.start !== undefined || options.end !== undefined)) {
    // Make sure range values are valid
    const start = Math.max(0, options.start || 0)
    const end = Math.min(stats.size - 1, options.end !== undefined ? options.end : stats.size - 1)
    
    const stream = fs.createReadStream(absolutePath, { start, end })
    return { 
      stream, 
      size: end - start + 1,
      mimeType,
      isRangeRequest: true
    }
  }
  
  // Return the whole file
  const stream = fs.createReadStream(absolutePath)
  return { 
    stream, 
    size: stats.size,
    mimeType,
    isRangeRequest: false
  }
}

export const ensureStorageFolder = FileHandler.ensureStorageFolder;
export const getFolderContents = FileHandler.getFolderContents;
export const getFileInfo = FileHandler.getFileObjectInfo;
export const readFileContent = FileHandler.readFile;
export const writeFile = FileHandler.writeFile;
export const deleteFile = FileHandler.deleteFile;
export const createFolder = FileHandler.createFolder;
export const deleteFolder = FileHandler.deleteFolder;
export const getItemById = FileHandler.getItemById;
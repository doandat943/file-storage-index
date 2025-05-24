import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import apiConfig from '../../config/api.config'
import { OdFileObject, OdFolderObject } from '../types'
import { Readable } from 'stream'

// Promisify FS functions
const fsReaddir = promisify(fs.readdir)
const fsStat = promisify(fs.stat)
const fsReadFile = promisify(fs.readFile)
const fsExists = promisify(fs.exists)
const fsWriteFile = promisify(fs.writeFile)
const fsMkdir = promisify(fs.mkdir)
const fsUnlink = promisify(fs.unlink)
const fsRmdir = promisify(fs.rmdir)

// Get the absolute path to the file storage directory
const fileStorageDir = path.resolve(process.cwd(), apiConfig.storageConfig.fileDirectory)

// Default chunk size for streaming (1MB)
const DEFAULT_CHUNK_SIZE = 1024 * 1024

// Extended MIME type mapping used throughout the module
const MIME_TYPES: Record<string, string> = {
  // Text and documents
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.pdf': 'application/pdf',
  
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  
  // Audio
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.opus': 'audio/opus',
  '.wma': 'audio/x-ms-wma',
  '.midi': 'audio/midi',
  '.mid': 'audio/midi',
  
  // Video
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.3gp': 'video/3gpp',
  '.ogv': 'video/ogg',
  '.ts': 'video/mp2t',
  
  // Archives
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  
  // Other
  '.swf': 'application/x-shockwave-flash',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.wasm': 'application/wasm',
}

/**
 * Determine MIME type based on file extension
 */
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

// Ensure file storage directory exists
export async function ensureStorageDir(): Promise<void> {
  if (!fs.existsSync(fileStorageDir)) {
    await fsMkdir(fileStorageDir, { recursive: true })
  }
}

// Resolve a relative path to the absolute path in the file system
export function resolveFilePath(relativePath: string): string {
  // Normalize and resolve the path
  let cleanPath = path.normalize(relativePath).replace(/^\/+/, '')
  return path.join(fileStorageDir, cleanPath)
}

// Convert a file's stats to the OdFileObject format
function fileToOdFile(filePath: string, stats: fs.Stats, fileName: string): OdFileObject {
  const mimeType = getMimeType(fileName)
  
  // Create OdFileObject
  const result: OdFileObject = {
    '@odata.context': 'local',
    name: fileName,
    size: stats.size,
    id: Buffer.from(filePath).toString('base64'),
    lastModifiedDateTime: stats.mtime.toISOString(),
    file: {
      mimeType,
      hashes: {
        quickXorHash: Buffer.from(filePath).toString('base64')
      }
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
      duration: 0,
      bitrate: 0,
      frameRate: 0,
      audioBitsPerSample: 0,
      audioChannels: 0,
      audioFormat: '',
      audioSamplesPerSecond: 0
    }
  }
  
  return result
}

// Define folder item type to match OdFolderObject value array items
type FolderItem = OdFileObject | {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  folder: {
    childCount: number;
    view: {
      sortBy: string;
      sortOrder: 'ascending';
      viewType: 'thumbnails';
    };
  };
}

// Function to calculate directory size
export async function calculateDirectorySize(directoryPath: string): Promise<number> {
  try {
    const absolutePath = resolveFilePath(directoryPath);
    const exists = await fsExists(absolutePath);
    
    if (!exists) {
      return 0;
    }
    
    const stats = await fsStat(absolutePath);
    
    if (!stats.isDirectory()) {
      return stats.size;
    }
    
    // Get all contents
    const files = await fsReaddir(absolutePath);
    
    if (files.length === 0) {
      return 0;
    }
    
    // Only calculate size of first level files for performance
    let size = 0;
    for (const file of files) {
      const filePath = path.join(absolutePath, file);
      const stats = await fsStat(filePath);
      
      if (stats.isDirectory()) {
        // For directories, use nominal size
        size += 4096; // Standard directory size
      } else {
        size += stats.size;
      }
    }
    
    return size;
  } catch (error: any) {
    console.error('Error calculating directory size:', error);
    return 0;
  }
}

// List files and folders in a directory
export async function getFolderContents(folderPath: string): Promise<OdFolderObject> {
  try {
    const absolutePath = resolveFilePath(folderPath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw new Error('Folder not found')
    }
    
    const isDir = (await fsStat(absolutePath)).isDirectory()
    
    if (!isDir) {
      throw new Error('Not a directory')
    }
    
    const files = await fsReaddir(absolutePath)
    const itemPromises = files.map(async (file) => {
      const filePath = path.join(absolutePath, file)
      const stats = await fsStat(filePath)
      
      if (stats.isDirectory()) {
        // It's a folder
        const relativeFolderPath = path.join(folderPath, file);
        const folderSize = await calculateDirectorySize(relativeFolderPath);
        
        return {
          id: Buffer.from(path.join(folderPath, file)).toString('base64'),
          name: file,
          size: folderSize,
          lastModifiedDateTime: stats.mtime.toISOString(),
          folder: {
            childCount: (await fsReaddir(filePath)).length,
            view: { sortBy: 'name', sortOrder: 'ascending', viewType: 'thumbnails' }
          }
        } as FolderItem
      } else {
        // It's a file
        return fileToOdFile(path.join(folderPath, file), stats, file) as FolderItem
      }
    })
    
    const items = await Promise.all(itemPromises)
    
    return {
      '@odata.count': items.length,
      '@odata.context': 'local',
      value: items
    }
  } catch (error: any) {
    // Only log real errors, not control flow exceptions
    if (error.message !== 'Folder not found' && error.message !== 'Not a directory') {
      console.error('Error getting folder contents:', error)
    }
    throw error
  }
}

// Get file information
export async function getFileInfo(filePath: string): Promise<OdFileObject> {
  try {
    const absolutePath = resolveFilePath(filePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw new Error('File not found')
    }
    
    const stats = await fsStat(absolutePath)
    
    if (stats.isDirectory()) {
      throw new Error('Not a file')
    }
    
    return fileToOdFile(filePath, stats, path.basename(filePath))
  } catch (error: any) {
    // Only log real errors, not control flow exceptions
    if (error.message !== 'File not found' && error.message !== 'Not a file') {
      console.error('Error getting file info:', error)
    }
    throw error
  }
}

// Read file content
export async function readFileContent(filePath: string): Promise<Buffer> {
  try {
    const absolutePath = resolveFilePath(filePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw new Error('File not found')
    }
    
    const stats = await fsStat(absolutePath)
    
    if (stats.isDirectory()) {
      throw new Error('Not a file')
    }
    
    return await fsReadFile(absolutePath)
  } catch (error: any) {
    if (error.message !== 'File not found' && error.message !== 'Not a file') {
      console.error('Error reading file content:', error)
    }
    throw error
  }
}

// Stream file content with range support
export function streamFileContent(filePath: string, range?: { start: number, end: number }): { 
  stream: Readable, 
  size: number, 
  mimeType: string,
  isRangeRequest: boolean
} {
  const absolutePath = resolveFilePath(filePath)
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error('File not found')
  }
  
  const stats = fs.statSync(absolutePath)
  
  if (stats.isDirectory()) {
    throw new Error('Not a file')
  }
  
  const mimeType = getMimeType(path.basename(filePath))
  
  // If range is specified, return a slice of the file
  if (range) {
    // Make sure range values are valid
    const start = Math.max(0, range.start)
    const end = Math.min(stats.size - 1, range.end || stats.size - 1)
    
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

// Write file content
export async function writeFile(relativePath: string, content: Buffer): Promise<void> {
  try {
    const absolutePath = resolveFilePath(relativePath)
    
    // Create parent directories if they don't exist
    const dir = path.dirname(absolutePath)
    if (!fs.existsSync(dir)) {
      await fsMkdir(dir, { recursive: true })
    }
    
    await fsWriteFile(absolutePath, content as unknown as Uint8Array)
  } catch (error) {
    console.error('Error writing file:', error)
    throw error
  }
}

// Delete a file
export async function deleteFile(relativePath: string): Promise<void> {
  try {
    const absolutePath = resolveFilePath(relativePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw new Error('File not found')
    }
    
    const stats = await fsStat(absolutePath)
    
    if (stats.isDirectory()) {
      throw new Error('Not a file')
    }
    
    await fsUnlink(absolutePath)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

// Delete a folder and its contents
export async function deleteFolder(relativePath: string): Promise<void> {
  try {
    const absolutePath = resolveFilePath(relativePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw new Error('Folder not found')
    }
    
    const stats = await fsStat(absolutePath)
    
    if (!stats.isDirectory()) {
      throw new Error('Not a directory')
    }
    
    // Read directory contents
    const files = await fsReaddir(absolutePath)
    
    // Delete all files and subdirectories
    for (const file of files) {
      const filePath = path.join(absolutePath, file)
      const fileStats = await fsStat(filePath)
      
      if (fileStats.isDirectory()) {
        await deleteFolder(path.join(relativePath, file))
      } else {
        await fsUnlink(filePath)
      }
    }
    
    // Now delete the empty directory
    await fsRmdir(absolutePath)
  } catch (error) {
    console.error('Error deleting folder:', error)
    throw error
  }
}

// Create a new folder
export async function createFolder(relativePath: string): Promise<void> {
  try {
    const absolutePath = resolveFilePath(relativePath)
    await fsMkdir(absolutePath, { recursive: true })
  } catch (error) {
    console.error('Error creating folder:', error)
    throw error
  }
}

// Get item by ID (used for direct file access by ID)
export async function getItemById(id: string): Promise<{ id: string; name: string; parentReference: any }> {
  try {
    // Decode the base64 ID to get the relative path
    const relativePath = Buffer.from(id, 'base64').toString('utf-8')
    const absolutePath = resolveFilePath(relativePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw new Error('Item not found')
    }
    
    // Get the parent directory and file name
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
  } catch (error) {
    console.error('Error getting item by ID:', error)
    throw error
  }
} 
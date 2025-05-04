import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import apiConfig from '../../config/api.config'
import { OdFileObject, OdFolderObject } from '../types'

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
  // Determine MIME type based on extension (basic implementation)
  const ext = path.extname(fileName).toLowerCase()
  let mimeType = 'application/octet-stream'
  
  // Basic MIME type mapping
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
  }
  
  if (ext in mimeTypes) {
    mimeType = mimeTypes[ext]
  }
  
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

// List files and folders in a directory (similar to OneDrive folder listing)
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
        return {
          id: Buffer.from(path.join(folderPath, file)).toString('base64'),
          name: file,
          size: 0,
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
  } catch (error) {
    // Only log real errors, not normal control flow exceptions
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
  } catch (error) {
    // Only log real errors, not normal control flow exceptions
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
  } catch (error) {
    // Only log real errors, not normal control flow exceptions
    if (error.message !== 'File not found' && error.message !== 'Not a file') {
      console.error('Error reading file:', error)
    }
    throw error
  }
}

// Write file
export async function writeFile(relativePath: string, content: Buffer): Promise<void> {
  try {
    const absolutePath = resolveFilePath(relativePath)
    // Ensure the directory exists
    const dirPath = path.dirname(absolutePath)
    
    if (!fs.existsSync(dirPath)) {
      await fsMkdir(dirPath, { recursive: true })
    }
    
    await fsWriteFile(absolutePath, content)
  } catch (error) {
    console.error('Error writing file:', error)
    throw error
  }
}

// Delete file
export async function deleteFile(relativePath: string): Promise<void> {
  try {
    const absolutePath = resolveFilePath(relativePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      return // File already doesn't exist
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

// Delete folder (recursively)
export async function deleteFolder(relativePath: string): Promise<void> {
  try {
    const absolutePath = resolveFilePath(relativePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      return // Folder already doesn't exist
    }
    
    const stats = await fsStat(absolutePath)
    
    if (!stats.isDirectory()) {
      throw new Error('Not a directory')
    }
    
    // First, get all contents
    const contents = await fsReaddir(absolutePath)
    
    // Delete all contents
    for (const item of contents) {
      const itemPath = path.join(absolutePath, item)
      const itemStats = await fsStat(itemPath)
      
      if (itemStats.isDirectory()) {
        // Recursively delete subdirectory
        await deleteFolder(path.join(relativePath, item))
      } else {
        // Delete file
        await fsUnlink(itemPath)
      }
    }
    
    // Finally, delete the now-empty directory
    await fsRmdir(absolutePath)
  } catch (error) {
    console.error('Error deleting folder:', error)
    throw error
  }
}

// Create folder
export async function createFolder(relativePath: string): Promise<void> {
  try {
    const absolutePath = resolveFilePath(relativePath)
    await fsMkdir(absolutePath, { recursive: true })
  } catch (error) {
    console.error('Error creating folder:', error)
    throw error
  }
}

// Get item by ID (base64 encoded path)
export async function getItemById(id: string): Promise<{ id: string; name: string; parentReference: any }> {
  try {
    // Decode the base64 ID to get the path
    const relativePath = Buffer.from(id, 'base64').toString()
    const absolutePath = resolveFilePath(relativePath)
    const exists = await fsExists(absolutePath)
    
    if (!exists) {
      throw new Error('Item not found')
    }
    
    const name = path.basename(relativePath)
    const parentPath = path.dirname(relativePath)
    
    return {
      id,
      name,
      parentReference: {
        path: parentPath === '.' ? '/' : parentPath
      }
    }
  } catch (error) {
    console.error('Error getting item by ID:', error)
    throw error
  }
} 
import path from 'path'
import { MEDIA_TYPE } from './constants'

/**
 * MIME type mapping for different file extensions
 */
export const MIME_TYPES: Record<string, string> = {
  // Text and documents
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ts': 'application/typescript',
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
  '.ts_video': 'video/mp2t',
  
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
  '.vtt': 'text/vtt',
  '.srt': 'application/x-subrip',
}

/**
 * Get MIME type based on file extension
 * @param fileName File name or path
 * @returns MIME type string
 */
export function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

/**
 * Check if a file is of a specific media type
 * @param fileName File name or path
 * @param type Media type to check
 * @returns Boolean indicating if file is of specified type
 */
export function isFileType(fileName: string, type: 'audio' | 'video' | 'image' | 'document' | 'text'): boolean {
  const ext = path.extname(fileName).toLowerCase()
  
  switch (type) {
    case 'audio':
      return MEDIA_TYPE.AUDIO.includes(ext)
    case 'video':
      return MEDIA_TYPE.VIDEO.includes(ext)
    case 'image':
      return MEDIA_TYPE.IMAGE.includes(ext)
    case 'document':
      return MEDIA_TYPE.DOCUMENT.includes(ext)
    case 'text':
      return MEDIA_TYPE.TEXT.includes(ext)
    default:
      return false
  }
}

/**
 * Get content type header for a file
 * @param fileName File name or path
 * @returns Content type string suitable for HTTP headers
 */
export function getContentType(fileName: string): string {
  return getMimeType(fileName)
}

/**
 * Check if the file should have a text content disposition
 * @param fileName File name or path
 * @returns Boolean indicating if the file should be treated as text
 */
export function isTextFile(fileName: string): boolean {
  const mimeType = getMimeType(fileName)
  return mimeType.startsWith('text/') || 
    mimeType === 'application/json' || 
    mimeType === 'application/xml' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript'
}

/**
 * Get appropriate content disposition for a file
 * @param fileName File name or path
 * @param forceDownload Whether to force download
 * @returns Content-Disposition header value
 */
export function getContentDisposition(fileName: string, forceDownload = false): string {
  const name = path.basename(fileName)
  const disposition = forceDownload || !isTextFile(fileName) ? 'attachment' : 'inline'
  return `${disposition}; filename="${encodeURIComponent(name)}"`
} 
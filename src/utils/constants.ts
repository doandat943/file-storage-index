import emojiRegex from 'emoji-regex'

/**
 * Constants used throughout the application
 */

// File system constants
export const FILE_SYSTEM = {
  // Default chunk size for streaming (1MB)
  DEFAULT_CHUNK_SIZE: 1024 * 1024,
  
  // Standard directory size for calculation
  STANDARD_DIRECTORY_SIZE: 4096,
}

// Cache control constants
export const CACHE_CONTROL = {
  // Cacheable file types
  CACHEABLE_TYPES: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 
    'css', 'js', 'woff', 'woff2', 'ttf'
  ],
  
  // Cache headers
  PUBLIC_CACHE: 'public, max-age=86400', // 24 hours
  NO_CACHE: 'no-cache',
  NO_STORE: 'no-store, max-age=0',
}

// Media file types
export const MEDIA_TYPE = {
  // Optional resource types (won't log errors when not found)
  OPTIONAL_RESOURCES: ['.vtt', '.srt', '.thumbnail'],
  
  // Audio file extensions
  AUDIO: ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.opus'],
  
  // Video file extensions
  VIDEO: ['.mp4', '.m4v', '.mkv', '.webm', '.mov', '.avi', '.wmv', '.flv', '.mpeg', '.mpg'],
  
  // Document file extensions
  DOCUMENT: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  
  // Image file extensions
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'],
  
  // Text file extensions
  TEXT: ['.txt', '.md', '.json', '.xml', '.csv', '.html', '.css', '.js', '.ts'],
}

// HTTP related constants
export const HTTP = {
  // Standard HTTP status codes with descriptions
  STATUS: {
    OK: 200,
    PARTIAL_CONTENT: 206,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    INTERNAL_SERVER_ERROR: 500,
  },
  
  // Headers
  HEADERS: {
    RANGE: 'range',
    CONTENT_TYPE: 'Content-Type',
    CONTENT_LENGTH: 'Content-Length',
    CONTENT_RANGE: 'Content-Range',
    CONTENT_DISPOSITION: 'Content-Disposition',
    ACCEPT_RANGES: 'Accept-Ranges',
    CACHE_CONTROL: 'Cache-Control',
  },
}

// Application defaults
export const APP_DEFAULTS = {
  // Default layouts
  LAYOUTS: {
    GRID: 'Grid',
    LIST: 'List',
  },
  
  // Default sort options
  SORT_OPTIONS: {
    NAME: 'name',
    SIZE: 'size',
    TIME: 'lastModifiedDateTime',
  },
  
  // Default view options
  VIEW_OPTIONS: {
    THUMBNAILS: 'thumbnails',
    DETAILS: 'details',
  },
}

// Regex patterns used in the application
export const PATTERNS = {
  // Matches range header like "bytes=0-1023"
  RANGE_HEADER: /bytes=(\d*)-(\d*)/,
  
  // Matches emoji characters
  EMOJI: emojiRegex(),
  
  // Matches file extensions
  FILE_EXTENSION: /\.([a-zA-Z0-9]+)$/,
} 
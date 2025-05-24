/**
 * API endpoints and file storage configuration
 */
module.exports = {
  // Local file storage configuration
  storageConfig: {
    // Root directory for file storage (relative to project root)
    fileDirectory: process.env.FILE_DIRECTORY || './file_storage',
    // Supported file formats for preview
    previewFileTypes: {
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
      video: ['mp4', 'webm', 'mkv', 'mov', 'flv', 'avi'],
      audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
      document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md']
    }
  },

  // Server configuration
  serverConfig: {
    // Default port if not specified in environment
    port: process.env.PORT || 3000,
    // Server address
    host: process.env.HOST || 'localhost'
  },

  // Cache configuration
  cacheConfig: {
    // Cache time-to-live (seconds)
    ttl: 60 * 60, // 1 hour
  },

  // Cache-Control header
  // - max-age=0: no browser caching
  // - s-maxage=60: cache is fresh for 60 seconds on the edge, then becomes stale
  // - stale-while-revalidate: allows serving stale content while revalidating on the edge
  cacheControlHeader: 'max-age=0, s-maxage=60, stale-while-revalidate',
}

/**
 * This file contains the configuration for the API endpoints and file storage.
 * 
 * The project has been modified to use local file storage instead of OneDrive.
 */
module.exports = {
  // Local file storage configuration
  storageConfig: {
    // Root directory for file storage (relative to project root)
    fileDirectory: process.env.FILE_DIRECTORY || './file_storage',
  },

  // Cache-Control header, check Vercel documentation for more details. The default settings imply:
  // - max-age=0: no cache for your browser
  // - s-maxage=0: cache is fresh for 60 seconds on the edge, after which it becomes stale
  // - stale-while-revalidate: allow serving stale content while revalidating on the edge
  // https://vercel.com/docs/concepts/functions/edge-caching
  cacheControlHeader: 'max-age=0, s-maxage=60, stale-while-revalidate',
}

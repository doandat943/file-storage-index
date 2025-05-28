/**
 * API endpoints and file storage configuration
 */
module.exports = {
  // Local file storage configuration
  storageConfig: {
    // Root directory for file storage (relative to project root)
    fileDirectory: process.env.STORAGE_ROOT || './data'
  },

  // Cache-Control header
  // - max-age=0: no browser caching
  // - s-maxage=60: cache is fresh for 60 seconds on the edge, then becomes stale
  // - stale-while-revalidate: allows serving stale content while revalidating on the edge
  cacheControlHeader: 'max-age=0, s-maxage=60, stale-while-revalidate',
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { encodePath } from '.'
import apiConfig from '../../../config/api.config'
import { HTTP } from '../../utils/constants'
import { withErrorHandling } from '../../utils/errorHandler'
import fs from 'fs'
import path from 'path'
import type { SearchResult } from '../../types'

/**
 * Sanitize the search query
 *
 * @param query User search query, which may contain special characters
 * @returns Sanitised query string
 */
function sanitiseQuery(query: string): string {
  return query
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex chars
    .trim()
    .toLowerCase()
}

/**
 * Search files and folders from local file system
 * 
 * @param query Search query
 * @param basePath Base path to search
 * @returns Array of search results
 */
const searchFiles = withErrorHandling(async (query: string, basePath: string): Promise<SearchResult> => {
  const storageDir = apiConfig.storageConfig.fileDirectory
  const searchPath = path.join(storageDir, basePath)
  const sanitizedQuery = sanitiseQuery(query)
  
  const results: SearchResult = []
  
  // Recursive function to traverse directory
  const walkDir = (dir: string, relativePath: string) => {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const file of files) {
      const filePath = path.join(dir, file.name)
      const relativeFilePath = path.join(relativePath, file.name)
      
      // Check if file/directory name contains query
      if (file.name.toLowerCase().includes(sanitizedQuery)) {
        const stats = fs.statSync(filePath)
        
        results.push({
          id: relativeFilePath,
          name: file.name,
          path: relativeFilePath,
          size: stats.size,
          lastModifiedDateTime: stats.mtime.toISOString(),
          ...(file.isDirectory() ? { folder: { childCount: 0 } } : { 
            file: { 
              mimeType: 'application/octet-stream' 
            } 
          })
        })
      }
      
      // If it's a directory, search recursively
      if (file.isDirectory()) {
        walkDir(filePath, relativeFilePath)
      }
    }
  }
  
  try {
    walkDir(searchPath, '')
    return results
  } catch (error) {
    console.error('Error searching files:', error)
    return []
  }
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Query parameter from request
  const { q: searchQuery = '' } = req.query

  // Set edge function caching for faster load times
  res.setHeader(HTTP.HEADERS.CACHE_CONTROL, apiConfig.cacheControlHeader)

  if (typeof searchQuery === 'string' && searchQuery.trim() !== '') {
    try {
      // Search files in local file system
      const searchRootPath = encodePath('/')
      const results = await searchFiles(searchQuery, searchRootPath)
      res.status(HTTP.STATUS.OK).json(results)
    } catch (error: any) {
      res.status(HTTP.STATUS.INTERNAL_SERVER_ERROR).json({ 
        error: 'Internal server error.',
        details: error.message 
      })
    }
  } else {
    res.status(HTTP.STATUS.OK).json([])
  }
}

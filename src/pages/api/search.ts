import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'
import { encodePath } from '.'
import siteConfig from '../../../config/site.config'
import apiConfig from '../../../config/api.config'
import { resolveFilePath, ensureStorageDir } from '../../utils/fileSystemHandler'

/**
 * Sanitize the search query
 *
 * @param query User search query, which may contain special characters
 * @returns Sanitised query string, which:
 * - encodes the '<' and '>' characters,
 * - replaces '?' and '/' characters with ' ',
 * - replaces ''' with ''''
 */
function sanitiseQuery(query: string): string {
  const sanitisedQuery = query
    .replace(/'/g, "''")
    .replace('<', ' &lt; ')
    .replace('>', ' &gt; ')
    .replace('?', ' ')
    .replace('/', ' ')
  return sanitisedQuery.toLowerCase()
}

async function searchFilesRecursively(directory: string, query: string): Promise<any[]> {
  const results: any[] = []
  try {
    // Ensure directory exists
    if (!fs.existsSync(directory)) {
      return results
    }

    const files = await fs.promises.readdir(directory)
    
    for (const file of files) {
      const filePath = path.join(directory, file)
      const stat = await fs.promises.stat(filePath)
      
      // Get the relative path from the storage root
      const storagePath = path.resolve(process.cwd(), apiConfig.storageConfig.fileDirectory)
      const relativePath = path.relative(storagePath, filePath)
      
      // Skip hidden files
      if (file.startsWith('.')) {
        continue
      }
      
      // Check if file name matches search query
      if (file.toLowerCase().includes(query)) {
        if (stat.isDirectory()) {
          results.push({
            id: Buffer.from(relativePath).toString('base64'),
            name: file,
            folder: { childCount: 0 },
            parentReference: {
              path: path.dirname(relativePath) === '.' ? '/' : ('/' + path.dirname(relativePath).replace(/\\/g, '/'))
            }
          })
        } else {
          results.push({
            id: Buffer.from(relativePath).toString('base64'),
            name: file,
            file: { mimeType: 'application/octet-stream' },
            parentReference: {
              path: path.dirname(relativePath) === '.' ? '/' : ('/' + path.dirname(relativePath).replace(/\\/g, '/'))
            }
          })
        }
      }
      
      // Recursively search in directories
      if (stat.isDirectory()) {
        const subResults = await searchFilesRecursively(filePath, query)
        results.push(...subResults)
      }
    }
    
    return results
  } catch (error) {
    console.error('Error searching files:', error)
    return results
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure storage directory exists
  await ensureStorageDir()

  // Query parameter from request
  const { q: searchQuery = '' } = req.query

  // Set edge function caching for faster load times
  res.setHeader('Cache-Control', apiConfig.cacheControlHeader)

  if (typeof searchQuery === 'string' && searchQuery.trim() !== '') {
    try {
      // Get the storage root directory
      const storageDir = path.resolve(process.cwd(), apiConfig.storageConfig.fileDirectory)
      
      // Search for files matching the query
      const results = await searchFilesRecursively(
        storageDir, 
        sanitiseQuery(searchQuery)
      )
      
      // Limit results to max items
      res.status(200).json(results.slice(0, siteConfig.maxItems))
    } catch (error: any) {
      console.error('Search error:', error)
      res.status(500).json({ error: 'Internal server error.' })
    }
  } else {
    res.status(200).json([])
  }
  return
}

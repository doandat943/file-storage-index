import { posix as pathPosix } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

import { checkAuthRoute, encodePath } from '.'
import apiConfig from '../../../config/api.config'
import { resolveFilePath, readFileContent } from '../../utils/fileSystemHandler'

// List of file extensions that can be thumbnailed
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get item thumbnails by its path since we will later check if it is protected
  const { path: reqPath = '', size = 'medium', odpt = '' } = req.query

  // Set edge function caching for faster load times, if route is not protected
  if (odpt === '') res.setHeader('Cache-Control', apiConfig.cacheControlHeader)

  // Check whether the size is valid - must be one of 'large', 'medium', or 'small'
  if (size !== 'large' && size !== 'medium' && size !== 'small') {
    res.status(400).json({ error: 'Invalid size' })
    return
  }
  // Sometimes the path parameter is defaulted to '[...path]' which we need to handle
  if (reqPath === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return
  }
  // If the path is not a valid path, return 400
  if (typeof reqPath !== 'string') {
    res.status(400).json({ error: 'Path query invalid.' })
    return
  }
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(reqPath))

  const { code, message } = await checkAuthRoute(cleanPath, odpt as string)
  // Status code other than 200 means user has not authenticated yet
  if (code !== 200) {
    res.status(code).json({ error: message })
    return
  }
  // If message is empty, then the path is not protected.
  // Conversely, protected routes are not allowed to serve from cache.
  if (message !== '') {
    res.setHeader('Cache-Control', 'no-cache')
  }

  const requestPath = encodePath(cleanPath)
  const filePath = resolveFilePath(requestPath)

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    // Check if file is a directory
    const stat = await fs.promises.stat(filePath)
    if (stat.isDirectory()) {
      res.status(400).json({ error: 'Thumbnails are only available for files, not directories' })
      return
    }

    // Check if file is an image
    const ext = path.extname(filePath).toLowerCase()
    if (imageExtensions.includes(ext)) {
      // For image files, just return the image itself as the thumbnail
      try {
        const fileContent = await readFileContent(requestPath)
        
        // Set appropriate headers
        res.setHeader('Content-Type', `image/${ext.substring(1) === 'jpg' ? 'jpeg' : ext.substring(1)}`)
        res.setHeader('Content-Length', stat.size)
        
        // Return the image content
        res.status(200).send(fileContent)
      } catch (error) {
        res.status(500).json({ error: 'Error reading file' })
      }
    } else {
      // For non-image files, we don't have real thumbnails, so return a 404
      res.status(404).json({ error: "The item doesn't have a valid thumbnail." })
    }
  } catch (error: any) {
    console.error('Error getting thumbnail:', error)
    res.status(500).json({ error: 'Internal server error.' })
  }
  return
}

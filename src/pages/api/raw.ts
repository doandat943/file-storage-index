import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'

import apiConfig from '../../../config/api.config'
import { encodePath, checkAuthRoute } from '.'
import { readFileContent, getFileInfo } from '../../utils/fileSystemHandler'

// CORS middleware for raw links: https://nextjs.org/docs/api-routes/api-middlewares
export function runCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const cors = Cors({ methods: ['GET', 'HEAD'] })
  return new Promise((resolve, reject) => {
    cors(req, res, result => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = '/', odpt = '', proxy = false } = req.query

  // Sometimes the path parameter is defaulted to '[...path]' which we need to handle
  if (path === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return
  }
  // If the path is not a valid path, return 400
  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path query invalid.' })
    return
  }
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))

  // Handle protected routes authentication
  const odTokenHeader = (req.headers['od-protected-token'] as string) ?? odpt

  const { code, message } = await checkAuthRoute(cleanPath, odTokenHeader)
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

  await runCorsMiddleware(req, res)
  try {
    const requestPath = encodePath(cleanPath)
    
    try {
      // Get file info first to check if it exists and is a file
      const fileInfo = await getFileInfo(requestPath)
      
      // Read the file content
      const fileContent = await readFileContent(requestPath)
      
      // Determine if we should proxy or directly serve the file
      if (proxy && fileInfo.size < 4194304) {
        // Set appropriate headers
        res.setHeader('Content-Type', fileInfo.file.mimeType)
        res.setHeader('Content-Length', fileInfo.size)
        res.setHeader('Cache-Control', apiConfig.cacheControlHeader)
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.name)}"`)
        
        // Send file content as response
        res.status(200).send(fileContent)
      } else {
        // For larger files, we'll set headers and stream the response
        res.setHeader('Content-Type', fileInfo.file.mimeType)
        res.setHeader('Content-Length', fileInfo.size)
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.name)}"`)
        
        // Send file content
        res.status(200).send(fileContent)
      }
    } catch (error: any) {
      if (error.message === 'File not found') {
        res.status(404).json({ error: 'File not found.' })
      } else if (error.message === 'Not a file') {
        res.status(400).json({ error: 'Path is not a file.' })
      } else {
        res.status(500).json({ error: 'Internal server error.' })
      }
    }
    
    return
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error.' })
    return
  }
}

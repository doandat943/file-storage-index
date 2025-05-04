import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'

import apiConfig from '../../../config/api.config'
import { encodePath, checkAuthRoute } from '.'
import { getFileInfo, streamFileContent } from '../../utils/fileSystemHandler'

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
      
      // Parse range header for video/audio streaming
      const rangeHeader = req.headers.range
      let range: { start: number, end: number } | undefined = undefined
      
      if (rangeHeader) {
        const matches = /bytes=(\d+)-(\d*)/.exec(rangeHeader)
        
        if (matches) {
          const start = parseInt(matches[1], 10)
          // If end is not specified, use the file size - 1
          const end = matches[2] ? parseInt(matches[2], 10) : fileInfo.size - 1
          
          // Validate range
          if (start >= 0 && end < fileInfo.size && start <= end) {
            range = { start, end }
          }
        }
      }
      
      // Stream the file content
      try {
        const { stream, size, mimeType, isRangeRequest } = streamFileContent(requestPath, range)
        
        // Set appropriate headers
        res.setHeader('Content-Type', mimeType)
        res.setHeader('Accept-Ranges', 'bytes')
        
        // For range requests, set range-specific headers
        if (isRangeRequest && range) {
          res.statusCode = 206 // Partial Content
          res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${fileInfo.size}`)
          res.setHeader('Content-Length', size)
        } else {
          res.statusCode = 200 // OK
          res.setHeader('Content-Length', fileInfo.size)
        }
        
        // Set cache control and content disposition headers
        res.setHeader('Cache-Control', apiConfig.cacheControlHeader)
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.name)}"`)
        
        // Pipe the stream to the response
        stream.pipe(res)
        
        // Handle stream errors
        stream.on('error', (err) => {
          console.error('Stream error:', err)
          // Only end the response if it hasn't been sent yet
          if (!res.writableEnded) {
            res.status(500).json({ error: 'Error streaming file.' })
          }
        })
        
        // Return from the function without ending the response,
        // as the stream will end it automatically
        return
      } catch (streamError: any) {
        console.error('Streaming error:', streamError)
        res.status(500).json({ error: 'Error streaming file content.' })
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

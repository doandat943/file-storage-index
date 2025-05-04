import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'

import apiConfig from '../../../config/api.config'
import { encodePath, checkAuthRoute } from '.'
import { getFileInfo, streamFileContent } from '../../utils/fileSystemHandler'

// CORS middleware for raw links
const cors = Cors({ methods: ['GET', 'HEAD'] })
function runCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  return new Promise((resolve, reject) => {
    cors(req, res, result => {
      if (result instanceof Error) return reject(result)
      return resolve(result)
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { path = '/', odpt = '' } = req.query

    // Validate path parameter
    if (path === '[...path]') {
      return res.status(400).json({ error: 'No path specified.' })
    }
    
    if (typeof path !== 'string') {
      return res.status(400).json({ error: 'Path query invalid.' })
    }
    
    const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))

    // Handle authentication
    const odTokenHeader = (req.headers['od-protected-token'] as string) ?? odpt
    const { code, message } = await checkAuthRoute(cleanPath, odTokenHeader)
    
    if (code !== 200) {
      return res.status(code).json({ error: message })
    }
    
    // Set cache headers based on protection status
    if (message !== '') {
      res.setHeader('Cache-Control', 'no-cache')
    }

    await runCorsMiddleware(req, res)
    
    const requestPath = encodePath(cleanPath)
    
    // Get file info
    const fileInfo = await getFileInfo(requestPath)
    
    // Process range header for streaming
    const rangeHeader = req.headers.range
    let range: { start: number, end: number } | undefined
    
    if (rangeHeader) {
      const matches = /bytes=(\d+)-(\d*)/.exec(rangeHeader)
      
      if (matches) {
        const start = parseInt(matches[1], 10)
        const end = matches[2] ? parseInt(matches[2], 10) : fileInfo.size - 1
        
        if (start >= 0 && end < fileInfo.size && start <= end) {
          range = { start, end }
        }
      }
    }
    
    // Stream the file
    const { stream, size, mimeType, isRangeRequest } = streamFileContent(requestPath, range)
    
    // Set headers
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Accept-Ranges', 'bytes')
    
    if (isRangeRequest && range) {
      res.statusCode = 206 // Partial Content
      res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${fileInfo.size}`)
      res.setHeader('Content-Length', size)
    } else {
      res.statusCode = 200 // OK
      res.setHeader('Content-Length', fileInfo.size)
    }
    
    res.setHeader('Cache-Control', apiConfig.cacheControlHeader)
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.name)}"`)
    
    // Stream to response
    stream.pipe(res)
    
    // Handle streaming errors
    stream.on('error', err => {
      console.error('Stream error:', err)
      if (!res.writableEnded) {
        res.status(500).json({ error: 'Error streaming file.' })
      }
    })
  } catch (error: any) {
    // Handle specific error cases
    if (error.message === 'File not found') {
      return res.status(404).json({ error: 'File not found.' })
    } else if (error.message === 'Not a file') {
      return res.status(400).json({ error: 'Path is not a file.' })
    } else {
      console.error('API error:', error)
      return res.status(500).json({ error: 'Internal server error.' })
    }
  }
}

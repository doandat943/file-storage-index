import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'
import { posix as pathPosix } from 'path'
import { streamFileContent } from '../../utils/fileSystemHandler'
import { checkAuthRoute, encodePath } from './index'
import siteConfig from '../../../config/site.config'

/**
 * CORS middleware for raw links
 * @param req Next.js request
 * @param res Next.js response
 * @returns Promise that resolves when CORS headers are set
 */
export function runCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const cors = Cors({ methods: ['GET', 'HEAD'] })
  return new Promise((resolve, reject) => {
    cors(req, res, result => {
      if (result instanceof Error) return reject(result)
      return resolve(result)
    })
  })
}

/**
 * Parse range header to get start and end bytes
 * @param rangeHeader Range header value
 * @param fileSize Total file size
 * @returns Object containing start and end bytes
 */
function parseRangeHeader(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  // Parse the range header value
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/)
  if (!match) return null

  const rangeStart = match[1] ? parseInt(match[1], 10) : 0
  const rangeEnd = match[2] ? parseInt(match[2], 10) : fileSize - 1

  // Ensure range values are valid
  const start = Math.max(0, rangeStart)
  const end = Math.min(fileSize - 1, rangeEnd)

  if (start > end) return null

  return { start, end }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  await runCorsMiddleware(req, res)

  const { path = '' } = req.query
  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path query is required.' })
    return
  }

  // Get the clean path
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))
  
  // Handle protected routes
  const { code, message } = await checkAuthRoute(cleanPath, req.headers['od-protected-token'] as string)
  if (code !== 200) {
    res.status(code).json({ error: message })
    return
  }

  // For protected routes, disable caching
  if (message !== '') {
    res.setHeader('Cache-Control', 'no-cache')
  } else {
    // By default caching is disabled for streaming, but can be enabled for specific types
    // Add smart caching based on file types
    const fileExtension = cleanPath.split('.').pop()?.toLowerCase() || ''
    const cacheableTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'css', 'js']
    
    if (cacheableTypes.includes(fileExtension)) {
      res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
    } else {
      res.setHeader('Cache-Control', 'no-cache')
    }
  }

  try {
    // Get the encoded path for file system
    const requestPath = encodePath(cleanPath)
    
    // Check for range header to support partial content requests (streaming)
    const rangeHeader = req.headers.range
    
    let range: { start: number; end: number } | undefined
    
    if (rangeHeader) {
      try {
        // Stream the file with range support
        const { stream, size, mimeType, isRangeRequest } = streamFileContent(
          requestPath,
          rangeHeader ? parseRangeHeader(rangeHeader, Infinity) || undefined : undefined
        )
        
        // Set appropriate headers for streaming
        res.setHeader('Content-Type', mimeType)
        res.setHeader('Accept-Ranges', 'bytes')
        
        if (isRangeRequest && rangeHeader) {
          const { start, end } = parseRangeHeader(rangeHeader, size) || { start: 0, end: size - 1 }
          res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`)
          res.setHeader('Content-Length', end - start + 1)
          res.status(206) // Partial Content
        } else {
          res.setHeader('Content-Length', size)
          res.status(200)
        }
        
        // Stream the file to the response
        stream.pipe(res)
        
        // Handle unexpected errors
        stream.on('error', error => {
          console.error('Stream error:', error)
          // The response might have already started, so we can't send an error status
          res.end()
        })
        
      } catch (error: any) {
        if (error.message === 'File not found') {
          res.status(404).json({ error: 'File not found.' })
        } else if (error.message === 'Not a file') {
          res.status(400).json({ error: 'Resource is not a file.' })
        } else {
          console.error('Streaming error:', error)
          res.status(500).json({ error: 'Internal server error.' })
        }
      }
    } else {
      // No range header, stream the entire file
      const { stream, size, mimeType } = streamFileContent(requestPath)
      
      res.setHeader('Content-Type', mimeType)
      res.setHeader('Content-Length', size)
      res.setHeader('Accept-Ranges', 'bytes')
      
      stream.pipe(res)
      
      stream.on('error', error => {
        console.error('Stream error:', error)
        res.end()
      })
    }
  } catch (error: any) {
    console.error('Raw API error:', error)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

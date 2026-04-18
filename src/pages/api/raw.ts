import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'
import { posix as pathPosix } from 'path'
import path from 'path'
import { streamFileContent, readFileContent, resolveFilePath } from '../../utils/fileHandler'
import { checkAuthRoute, encodePath } from './index'
import siteConfig from '../../../config/site.config'
import fs from 'fs'
import { promisify } from 'util'
import { CACHE_CONTROL, HTTP, PATTERNS } from '../../utils/constants'

// Promisify fs functions
const fsStat = promisify(fs.stat)

// HTTP response types
type ErrorResponse = { error: string; message?: string }
type SuccessResponse = Buffer | void

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
  const match = rangeHeader.match(PATTERNS.RANGE_HEADER)
  if (!match) return null

  const rangeStart = match[1] ? parseInt(match[1], 10) : 0
  const rangeEnd = match[2] ? parseInt(match[2], 10) : fileSize - 1

  // Ensure range values are valid
  const start = Math.max(0, rangeStart)
  const end = Math.min(fileSize - 1, rangeEnd)

  if (start > end) return null

  return { start, end }
}

/**
 * Check if the request is for an optional resource like subtitles or thumbnails
 * @param req NextApiRequest
 * @returns boolean
 */
function isOptionalResource(req: NextApiRequest): boolean {
  const { path = '' } = req.query
  if (typeof path !== 'string') return false
  
  // Check if the path is for subtitles or thumbnails
  return path.toLowerCase().endsWith('.vtt') || 
         (req.url !== undefined && req.url.includes('/api/thumbnail'));
}

/**
 * Set cache control headers based on file type
 * @param res Response object
 * @param fileExtension File extension
 * @param isProtected Whether the route is protected
 */
function setCacheHeaders(res: NextApiResponse, fileExtension: string, isProtected: boolean): void {
  if (isProtected) {
    res.setHeader('Cache-Control', CACHE_CONTROL.NO_CACHE)
    return
  }
  
  if (CACHE_CONTROL.CACHEABLE_TYPES.includes(fileExtension)) {
    res.setHeader('Cache-Control', CACHE_CONTROL.PUBLIC_CACHE)
  } else {
    res.setHeader('Cache-Control', CACHE_CONTROL.NO_CACHE)
  }
}

/**
 * Stream file content with range support
 */
function streamFile(requestPath: string, req: NextApiRequest, res: NextApiResponse): void {
  const rangeHeader = req.headers.range
  
  // Get file stream with range support
  const rangeInfo = rangeHeader ? parseRangeHeader(rangeHeader, Infinity) : undefined
  const { stream, size, mimeType, isRangeRequest } = streamFileContent(
    requestPath, 
    rangeInfo || undefined
  )
  
  // Set headers
  res.setHeader(HTTP.HEADERS.CONTENT_TYPE, mimeType)
  res.setHeader(HTTP.HEADERS.ACCEPT_RANGES, 'bytes')
  
  if (isRangeRequest && rangeHeader) {
    const { start, end } = parseRangeHeader(rangeHeader, size) || { start: 0, end: size - 1 }
    res.setHeader(HTTP.HEADERS.CONTENT_RANGE, `bytes ${start}-${end}/${size}`)
    res.setHeader(HTTP.HEADERS.CONTENT_LENGTH, end - start + 1)
    res.status(HTTP.STATUS.PARTIAL_CONTENT)
  } else {
    res.setHeader(HTTP.HEADERS.CONTENT_LENGTH, size)
    res.status(HTTP.STATUS.OK)
  }
  
  stream.pipe(res)
  stream.on('error', () => res.end())
}

/**
 * Handle error responses
 */
function handleError(error: any, req: NextApiRequest, res: NextApiResponse): void {
  const { path = '' } = req.query
  if (error.message === 'File not found') {
    if (isOptionalResource(req)) {
      res.status(HTTP.STATUS.NOT_FOUND).json({ error: 'Optional resource not found.' })
    } else {
      res.status(HTTP.STATUS.NOT_FOUND).json({ error: 'File not found.' })
    }
  } else {
    console.error(`Raw API error for ${path}:`, error)
    res.status(HTTP.STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error.' })
  }
}

/**
 * Main handler for raw file requests
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  try {
    // Set CORS headers
    await runCorsMiddleware(req, res)

    const { path = '' } = req.query
    if (typeof path !== 'string' || path === '' || path === '/') {
      res.status(HTTP.STATUS.BAD_REQUEST).json({ 
        error: 'Invalid path.', 
        message: 'Please specify a valid file path to access.'
      })
      return
    }
    
    // Normalize and get clean path
    const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))
    
    // Handle protected routes
    const { code, message } = await checkAuthRoute(cleanPath, req.headers['od-protected-token'] as string)
    if (code !== HTTP.STATUS.OK) {
      res.status(code).json({ error: message })
      return
    }

    // Set cache headers
    const fileExtension = cleanPath.split('.').pop()?.toLowerCase() || ''
    setCacheHeaders(res, fileExtension, message !== '')

    // Get the encoded path for file system
    const requestPath = encodePath(cleanPath)
    
    // Set Content-Disposition to preserve filename
    const rawName = cleanPath.split('/').pop() || 'file'
    const fileName = (() => {
      try {
        return decodeURIComponent(rawName)
      } catch {
        return rawName
      }
    })()
    const encodedName = encodeURIComponent(fileName)
    
    // Use 'inline' for media types to allow in-browser playback, 'attachment' for others
    const isMedia = ['mp4', 'm4a', 'webm', 'mp3', 'wav', 'ogg', 'vtt'].includes(fileExtension)
    res.setHeader(
      HTTP.HEADERS.CONTENT_DISPOSITION,
      `${isMedia ? 'inline' : 'attachment'}; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
    )

    // Handle all file types with streaming and range support
    streamFile(requestPath, req, res)
    
  } catch (error: any) {
    handleError(error, req, res)
  }
}

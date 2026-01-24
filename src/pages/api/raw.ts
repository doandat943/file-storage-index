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
 * Handle M4A file request
 * @param requestPath Encoded file path
 * @param cleanPath Clean URL path
 * @param res Response object
 */
async function handleM4AFile(requestPath: string, cleanPath: string, res: NextApiResponse): Promise<void> {
  const fileBuffer = await readFileContent(requestPath)
  const fileName = cleanPath.split('/').pop() || 'audio.m4a'
  
  res.setHeader(HTTP.HEADERS.CONTENT_TYPE, 'audio/mp4')
  res.setHeader(HTTP.HEADERS.CONTENT_LENGTH, fileBuffer.length)
  res.setHeader(HTTP.HEADERS.ACCEPT_RANGES, 'bytes')
  res.setHeader(HTTP.HEADERS.CONTENT_DISPOSITION, `inline; filename="${encodeURIComponent(fileName)}"`)
  res.status(HTTP.STATUS.OK).send(fileBuffer)
}

/**
 * Handle MP4 file request with range support
 * @param requestPath Encoded file path
 * @param cleanPath Clean URL path
 * @param req Request object
 * @param res Response object
 */
async function handleMP4File(
  requestPath: string, 
  cleanPath: string, 
  req: NextApiRequest, 
  res: NextApiResponse
): Promise<void> {
  res.setHeader(HTTP.HEADERS.CONTENT_TYPE, 'video/mp4')
  res.setHeader(HTTP.HEADERS.ACCEPT_RANGES, 'bytes')
  
  const fileName = cleanPath.split('/').pop() || 'video.mp4'
  res.setHeader(HTTP.HEADERS.CONTENT_DISPOSITION, `inline; filename="${encodeURIComponent(fileName)}"`)
  
  // If range header exists, handle range requests
  const rangeHeader = req.headers.range
  if (rangeHeader) {
    const absolutePath = resolveFilePath(requestPath)
    const stats = await fsStat(absolutePath)
    const fileSize = stats.size
    
    const range = parseRangeHeader(rangeHeader, fileSize)
    if (range) {
      const { start, end } = range
      const chunkSize = end - start + 1
      
      res.setHeader(HTTP.HEADERS.CONTENT_RANGE, `bytes ${start}-${end}/${fileSize}`)
      res.setHeader(HTTP.HEADERS.CONTENT_LENGTH, chunkSize)
      res.status(HTTP.STATUS.PARTIAL_CONTENT) // Partial Content
      
      const fileStream = fs.createReadStream(absolutePath, { start, end })
      fileStream.pipe(res)
      return
    }
  }
  
  // No range header, serve entire file
  const fileBuffer = await readFileContent(requestPath)
  res.setHeader(HTTP.HEADERS.CONTENT_LENGTH, fileBuffer.length)
  res.status(HTTP.STATUS.OK).send(fileBuffer)
}

/**
 * Stream file content with range support
 * @param requestPath Encoded file path
 * @param req Request object
 * @param res Response object
 */
function streamFile(requestPath: string, req: NextApiRequest, res: NextApiResponse): void {
  const rangeHeader = req.headers.range
  
  // Determine if this is a range request
  const rangeData = rangeHeader ? parseRangeHeader(rangeHeader, Infinity) : null
  const rangeInfo = rangeData ? rangeData : undefined
  
  // Get file stream with range support
  const { stream, size, mimeType, isRangeRequest } = streamFileContent(requestPath, rangeInfo)
  
  // Set headers
  res.setHeader(HTTP.HEADERS.CONTENT_TYPE, mimeType)
  res.setHeader(HTTP.HEADERS.ACCEPT_RANGES, 'bytes')
  
  if (isRangeRequest && rangeHeader) {
    const { start, end } = parseRangeHeader(rangeHeader, size) || { start: 0, end: size - 1 }
    res.setHeader(HTTP.HEADERS.CONTENT_RANGE, `bytes ${start}-${end}/${size}`)
    res.setHeader(HTTP.HEADERS.CONTENT_LENGTH, end - start + 1)
    res.status(HTTP.STATUS.PARTIAL_CONTENT) // Partial Content
  } else {
    res.setHeader(HTTP.HEADERS.CONTENT_LENGTH, size)
    res.status(HTTP.STATUS.OK)
  }
  
  // Stream the file to the response
  stream.pipe(res)
  
  // Handle unexpected errors
  stream.on('error', error => {
    console.error('Stream error:', error)
    // The response might have already started, so we can't send an error status
    res.end()
  })
}

/**
 * Handle error responses with appropriate status codes and logging
 * @param error Error object
 * @param req Request object
 * @param res Response object
 */
function handleError(error: any, req: NextApiRequest, res: NextApiResponse): void {
  const { path = '' } = req.query
  
  if (error.message === 'File not found') {
    // For optional resources (subtitles, thumbnails), return 404 without logging
    if (isOptionalResource(req)) {
      res.status(HTTP.STATUS.NOT_FOUND).json({ error: 'Optional resource not found.' })
    } else {
      // Log and return 404 for required files
      console.error(`Raw API error for ${path}:`, error)
      res.status(HTTP.STATUS.NOT_FOUND).json({ error: 'File not found.' })
    }
  } else if (error.message === 'Not a file') {
    res.status(HTTP.STATUS.BAD_REQUEST).json({ error: 'Resource is not a file.' })
  } else {
    // Log and return 500 for other errors
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
    if (typeof path !== 'string') {
      res.status(HTTP.STATUS.BAD_REQUEST).json({ error: 'Path query is required.' })
      return
    }
    
    // Handle API directory access directly
    if (path === '' || path === '/') {
      res.status(HTTP.STATUS.BAD_REQUEST).json({ 
        error: 'Direct API access is not allowed.', 
        message: 'Please specify a valid file path to access.'
      })
      return
    }

    // Get the clean path
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
    
    // Handle different file types
    if (cleanPath.toLowerCase().endsWith('.m4a')) {
      await handleM4AFile(requestPath, cleanPath, res)
    } else if (cleanPath.toLowerCase().endsWith('.mp4')) {
      await handleMP4File(requestPath, cleanPath, req, res)
    } else {
      // Force browsers to preserve the original filename when downloading
      const rawName = cleanPath.split('/').pop() || 'file'
      const fileName = (() => {
        try {
          return decodeURIComponent(rawName)
        } catch {
          return rawName
        }
      })()
      const encodedName = encodeURIComponent(fileName)
      res.setHeader(
        HTTP.HEADERS.CONTENT_DISPOSITION,
        `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
      )

      // Handle all other file types with streaming
      streamFile(requestPath, req, res)
    }
  } catch (error: any) {
    handleError(error, req, res)
  }
}

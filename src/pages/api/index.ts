import { posix as pathPosix } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'
import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'
import { compareHashedToken } from '../../utils/authHandler'
import { getFolderContents, getFileInfo, ensureStorageDir, readFileContent } from '../../utils/fileHandler'
import { HTTP, CACHE_CONTROL } from '../../utils/constants'
import { handleApiError, createRequestError } from '../../utils/errorHandler'

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

const basePath = pathPosix.resolve('/', siteConfig.baseDirectory)

/**
 * Encode the path of the file relative to the base directory
 *
 * @param path Relative path of the file to the base directory
 * @returns Path for local file access
 */
export function encodePath(path: string): string {
  let encodedPath = pathPosix.join(basePath, path)
  if (encodedPath === '/' || encodedPath === '') {
    return ''
  }
  encodedPath = encodedPath.replace(/\/$/, '')
  return encodedPath
}

/**
 * Match protected routes in site config to get path to required auth token
 * @param path Path cleaned in advance
 * @returns Path to required auth token. If not required, return empty string.
 */
export function getAuthTokenPath(path: string) {
  // Ensure trailing slashes to compare paths component by component
  path = path.toLowerCase() + '/'
  const protectedRoutes = siteConfig.protectedRoutes as string[]
  let authTokenPath = ''
  for (let r of protectedRoutes) {
    if (typeof r !== 'string') continue
    r = r.toLowerCase().replace(/\/$/, '') + '/'
    if (path.startsWith(r)) {
      authTokenPath = `${r}.password`
      break
    }
  }
  return authTokenPath
}

/**
 * Handles protected route authentication:
 * - Match the cleanPath against an array of user defined protected routes
 * - If a match is found:
 * - 1. Read the .password file stored inside the protected route
 * - 2. Check if the od-protected-token header is present in the request
 * - The request is continued only if these two contents are exactly the same
 *
 * @param cleanPath Sanitised directory path, used for matching whether route is protected
 * @param odTokenHeader Protected token from request header
 */
export async function checkAuthRoute(
  cleanPath: string,
  odTokenHeader: string
): Promise<{ code: number; message: string }> {
  // Handle authentication through .password
  const authTokenPath = getAuthTokenPath(cleanPath)

  // Fetch password from file content
  if (authTokenPath === '') {
    return { code: HTTP.STATUS.OK, message: '' }
  }

  try {
    // Read the password file
    const passwordContent = await readFileContent(authTokenPath)
    const odProtectedToken = passwordContent.toString()

    if (
      !compareHashedToken({
        odTokenHeader: odTokenHeader,
        dotPassword: odProtectedToken,
      })
    ) {
      return { code: HTTP.STATUS.UNAUTHORIZED, message: 'Password required.' }
    }
  } catch (error: any) {
    // Password file not found, fallback to 404
    if (error.message === 'File not found') {
      return { code: HTTP.STATUS.NOT_FOUND, message: "You didn't set a password." }
    } else {
      return { code: HTTP.STATUS.INTERNAL_SERVER_ERROR, message: 'Internal server error.' }
    }
  }

  return { code: HTTP.STATUS.OK, message: 'Authenticated.' }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure storage directory exists
    await ensureStorageDir()

    // If method is GET, then the API is a normal request for files or folders
    const { path = '/', raw = false, next = '', sort = '' } = req.query

    // Set edge function caching for faster load times
    res.setHeader(HTTP.HEADERS.CACHE_CONTROL, apiConfig.cacheControlHeader)

    // Sometimes the path parameter is defaulted to '[...path]' which we need to handle
    if (path === '[...path]') {
      throw createRequestError.invalidPath('No path specified.')
    }
    
    // If the path is not a valid path, return 400
    if (typeof path !== 'string') {
      throw createRequestError.invalidPath('Path query invalid.')
    }
    
    // Normalize and make absolute, then trim trailing slashes
    const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path)).replace(/\/$/, '')

    // Validate sort param
    if (typeof sort !== 'string') {
      throw createRequestError.invalidParams('Sort query invalid.')
    }

    // Handle protected routes authentication
    const { code, message } = await checkAuthRoute(cleanPath, req.headers['od-protected-token'] as string)
    // Status code other than 200 means user has not authenticated yet
    if (code !== HTTP.STATUS.OK) {
      res.status(code).json({ error: message })
      return
    }
    // If message is not empty, then the path is protected.
    // Conversely, protected routes are not allowed to serve from cache.
    if (message !== '') {
      res.setHeader(HTTP.HEADERS.CACHE_CONTROL, CACHE_CONTROL.NO_CACHE)
    }

    const requestPath = encodePath(cleanPath)

    // Go for file raw download link, add CORS headers
    if (raw) {
      await runCorsMiddleware(req, res)
      res.setHeader(HTTP.HEADERS.CACHE_CONTROL, CACHE_CONTROL.NO_CACHE)

      try {
        // Get file info
        const fileInfo = await getFileInfo(requestPath)
        
        // Read the file content
        const fileContent = await readFileContent(requestPath)
        
        // Set appropriate headers
        res.setHeader(HTTP.HEADERS.CONTENT_TYPE, fileInfo.file.mimeType)
        res.setHeader(HTTP.HEADERS.CONTENT_LENGTH, fileInfo.size)
        res.setHeader(HTTP.HEADERS.CONTENT_DISPOSITION, `inline; filename="${encodeURIComponent(fileInfo.name)}"`)
        
        // Return the file content
        res.status(HTTP.STATUS.OK).send(fileContent)
      } catch (error: any) {
        handleApiError(error, res, 'api/raw')
      }

      return
    }

    // Determine if it's a file or folder
    try {
      // Try to get file info first
      const fileInfo = await getFileInfo(requestPath)
      // If no error, it's a file
      res.status(HTTP.STATUS.OK).json({ file: fileInfo })
    } catch (fileError: any) {
      // If not a file, try to get folder contents
      if (fileError.message === 'File not found' || fileError.message === 'Not a file') {
        try {
          const folderContents = await getFolderContents(requestPath)
          res.status(HTTP.STATUS.OK).json({ folder: folderContents })
        } catch (folderError: any) {
          handleApiError(folderError, res, 'api/folder')
        }
      } else {
        handleApiError(fileError, res, 'api/file')
      }
    }
  } catch (error: unknown) {
    handleApiError(error, res, 'api')
  }
}

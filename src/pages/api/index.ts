import { posix as pathPosix } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'
import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'
import { compareHashedToken } from '../../utils/protectedRouteHandler'
import { getFolderContents, getFileInfo, ensureStorageDir, readFileContent } from '../../utils/fileSystemHandler'

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
  // Ensure trailing slashes to compare paths component by component. Same for protectedRoutes.
  // Since paths are case insensitive, lower case before comparing. Same for protectedRoutes.
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
): Promise<{ code: 200 | 401 | 404 | 500; message: string }> {
  // Handle authentication through .password
  const authTokenPath = getAuthTokenPath(cleanPath)

  // Fetch password from file content
  if (authTokenPath === '') {
    return { code: 200, message: '' }
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
      return { code: 401, message: 'Password required.' }
    }
  } catch (error: any) {
    // Password file not found, fallback to 404
    if (error.message === 'File not found') {
      return { code: 404, message: "You didn't set a password." }
    } else {
      return { code: 500, message: 'Internal server error.' }
    }
  }

  return { code: 200, message: 'Authenticated.' }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure storage directory exists
  await ensureStorageDir()

  // If method is GET, then the API is a normal request for files or folders
  const { path = '/', raw = false, next = '', sort = '' } = req.query

  // Set edge function caching for faster load times, check docs:
  // https://vercel.com/docs/concepts/functions/edge-caching
  res.setHeader('Cache-Control', apiConfig.cacheControlHeader)

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
  // Besides normalizing and making absolute, trailing slashes are trimmed
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path)).replace(/\/$/, '')

  // Validate sort param
  if (typeof sort !== 'string') {
    res.status(400).json({ error: 'Sort query invalid.' })
    return
  }

  // Handle protected routes authentication
  const { code, message } = await checkAuthRoute(cleanPath, req.headers['od-protected-token'] as string)
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

  try {
    // Go for file raw download link, add CORS headers
    if (raw) {
      await runCorsMiddleware(req, res)
      res.setHeader('Cache-Control', 'no-cache')

      try {
        // Get file info
        const fileInfo = await getFileInfo(requestPath)
        
        // Read the file content
        const fileContent = await readFileContent(requestPath)
        
        // Set appropriate headers
        res.setHeader('Content-Type', fileInfo.file.mimeType)
        res.setHeader('Content-Length', fileInfo.size)
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.name)}"`)
        
        // Return the file content
        res.status(200).send(fileContent)
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
    }

    // Determine if it's a file or folder
    try {
      // Try to get file info first
      const fileInfo = await getFileInfo(requestPath)
      // If no error, it's a file
      res.status(200).json({ file: fileInfo })
    } catch (fileError: any) {
      // If not a file, try to get folder contents
      if (fileError.message === 'File not found' || fileError.message === 'Not a file') {
        try {
          const folderContents = await getFolderContents(requestPath)
          res.status(200).json({ folder: folderContents })
        } catch (folderError: any) {
          if (folderError.message === 'Folder not found') {
            res.status(404).json({ error: 'Resource not found.' })
          } else if (folderError.message === 'Not a directory') {
            res.status(400).json({ error: 'Path is not a directory.' })
          } else {
            console.error('Folder error:', folderError)
            res.status(500).json({ error: 'Internal server error.' })
          }
        }
      } else {
        console.error('File error:', fileError)
        res.status(500).json({ error: 'Internal server error.' })
      }
    }
  } catch (error: any) {
    console.error('General error:', error)
    res.status(500).json({ error: 'Internal server error.' })
  }
}

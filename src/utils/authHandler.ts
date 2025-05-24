import crypto from 'crypto'
import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'
import { HTTP } from './constants'
import { createAuthError } from './errorHandler'

// Encryption key for passwords
const HASH_SECRET_KEY = 'file-storage-index'

/**
 * Encrypt password
 * @param password Password to encrypt
 * @returns Encrypted string
 */
export function hashPassword(password: string): string {
  return crypto
    .createHmac('sha256', HASH_SECRET_KEY)
    .update(password)
    .digest('hex')
}

/**
 * Compare provided token with encrypted password
 * @param param0 Object containing token and encrypted password
 * @returns Boolean indicating if token is valid
 */
export function compareHashedToken({
  odTokenHeader,
  dotPassword,
}: {
  odTokenHeader: string
  dotPassword: string
}): boolean {
  if (!odTokenHeader || !dotPassword) {
    return false
  }
  
  // Compare encrypted tokens
  if (dotPassword.length === 64) {
    // If password is already encrypted
    return odTokenHeader === dotPassword
  } else {
    // If password is not encrypted, encrypt it then compare
    return odTokenHeader === hashPassword(dotPassword)
  }
}

/**
 * Middleware to protect API with API key authentication
 * @param handler API handler
 * @returns Protected API handler
 */
export function withApiAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const apiKey = req.headers['x-api-key'] as string
    
    // Check API key
    if (!apiKey || apiKey !== process.env.API_KEY) {
      const error = createAuthError.unauthorized('Invalid or missing API key')
      return res.status(error.status).json({ error: error.message, code: error.code })
    }
    
    // Call original handler if authentication succeeds
    return handler(req, res)
  }
}

/**
 * Middleware to enable CORS
 * @param handler API handler
 * @returns API handler with CORS
 */
export function withCors(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.status(HTTP.STATUS.OK).end()
    }
    
    // Call original handler
    return handler(req, res)
  }
} 
import crypto from 'crypto'

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
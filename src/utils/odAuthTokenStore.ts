// This file provides a dummy implementation for compatibility
// It's not used in the local file storage version of the app

export async function getOdAuthTokens(): Promise<{ accessToken: unknown; refreshToken: unknown }> {
  return {
    accessToken: null,
    refreshToken: null,
  }
}

export async function storeOdAuthTokens({
  accessToken,
  accessTokenExpiry,
  refreshToken,
}: {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
}): Promise<void> {
  // Do nothing, this is just a compatibility function
  return
}

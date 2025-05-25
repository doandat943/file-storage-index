import { getItemById } from '../../utils/fileHandler'
import type { NextApiRequest, NextApiResponse } from 'next'
import { HTTP } from '../../utils/constants'
import { handleApiError } from '../../utils/errorHandler'
import { ErrorCode } from '../../utils/errorHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get ID from query parameters
  const { id = '' } = req.query
  if (typeof id !== 'string') {
    res.status(HTTP.STATUS.BAD_REQUEST).json({ error: 'Invalid ID.', code: ErrorCode.INVALID_PARAMS })
    return
  }

  try {
    // Get item information by ID (file or folder)
    const item = await getItemById(id)
    res.status(HTTP.STATUS.OK).json(item)
  } catch (error: unknown) {
    handleApiError(error, res, 'api/item')
  }
}

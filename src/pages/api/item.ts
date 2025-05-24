import { getItemById } from '../../utils/fileHandler'
import type { NextApiRequest, NextApiResponse } from 'next'
import { HTTP } from '../../utils/constants'
import { handleApiError } from '../../utils/errorHandler'
import { ErrorCode } from '../../utils/errorHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Lấy ID từ tham số truy vấn
  const { id = '' } = req.query
  if (typeof id !== 'string') {
    res.status(HTTP.STATUS.BAD_REQUEST).json({ error: 'ID không hợp lệ.', code: ErrorCode.INVALID_PARAMS })
    return
  }

  try {
    // Lấy thông tin mục theo ID (file hoặc thư mục)
    const item = await getItemById(id)
    res.status(HTTP.STATUS.OK).json(item)
  } catch (error: unknown) {
    handleApiError(error, res, 'api/item')
  }
}

import type { NextApiRequest, NextApiResponse } from 'next'
import apiConfig from '../../../config/api.config'
import { getItemById } from '../../utils/fileSystemHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get item details (specifically, its path) by its unique ID (base64 encoded path)
  const { id = '' } = req.query

  // Set edge function caching for faster load times, check docs:
  // https://vercel.com/docs/concepts/functions/edge-caching
  res.setHeader('Cache-Control', apiConfig.cacheControlHeader)

  if (typeof id === 'string') {
    try {
      const item = await getItemById(id)
      res.status(200).json(item)
    } catch (error: any) {
      res.status(404).json({ error: error?.message ?? 'Item not found.' })
    }
  } else {
    res.status(400).json({ error: 'Invalid item ID.' })
  }
  return
}

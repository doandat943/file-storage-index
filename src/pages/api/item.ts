import type { NextApiRequest, NextApiResponse } from 'next'
import { getItemById } from '../../utils/fileSystemHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get ID from query params
  const { id = '' } = req.query
  if (typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid ID.' })
    return
  }

  try {
    // Get item info by ID (file or folder)
    const item = await getItemById(id)
    res.status(200).json(item)
  } catch (error: any) {
    if (error.message === 'Item not found') {
      res.status(404).json({ error: 'Item not found.' })
    } else {
      console.error('Error getting item by ID:', error)
      res.status(500).json({ error: 'Internal server error.' })
    }
  }
}

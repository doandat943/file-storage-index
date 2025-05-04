import { posix as pathPosix } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { deleteFile, deleteFolder, createFolder } from '../../utils/fileSystemHandler'
import { checkAuthRoute, encodePath } from '.'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { path = '/' } = req.query
  
  // If the path is not a valid path, return 400
  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path query invalid.' })
    return
  }

  // Clean path
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path)).replace(/\/$/, '')
  
  // Check authentication if needed
  const { code, message } = await checkAuthRoute(cleanPath, req.headers['od-protected-token'] as string)
  if (code !== 200) {
    res.status(code).json({ error: message })
    return
  }

  // Get the action to perform from the request body
  const { action, name } = req.body

  if (!action) {
    res.status(400).json({ error: 'Action is required' })
    return
  }

  const requestPath = encodePath(cleanPath)

  try {
    switch (action) {
      case 'create_folder': {
        if (!name) {
          res.status(400).json({ error: 'Folder name is required' })
          return
        }
        
        const newFolderPath = pathPosix.join(requestPath, name)
        await createFolder(newFolderPath)
        
        res.status(200).json({ success: true, message: 'Folder created successfully' })
        break
      }
      
      case 'delete_file': {
        await deleteFile(requestPath)
        res.status(200).json({ success: true, message: 'File deleted successfully' })
        break
      }
      
      case 'delete_folder': {
        await deleteFolder(requestPath)
        res.status(200).json({ success: true, message: 'Folder deleted successfully' })
        break
      }
      
      default:
        res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error: any) {
    console.error('Error in file management:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
} 
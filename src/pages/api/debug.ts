import type { NextApiRequest, NextApiResponse } from 'next'
import { getFolderContents, getFileInfo, ensureStorageDir } from '../../utils/fileSystemHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure storage directory exists
  await ensureStorageDir()

  try {
    // Get folder contents from root
    const folderContents = await getFolderContents('/')
    
    // Return debug information
    res.status(200).json({
      success: true,
      folderContents,
      info: {
        folderCount: folderContents.value.filter(item => 'folder' in item).length,
        fileCount: folderContents.value.filter(item => 'file' in item).length,
        totalCount: folderContents.value.length,
        folderStructure: folderContents
      }
    })
  } catch (error) {
    console.error('Error in debug API:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: error.stack
    })
  }
} 
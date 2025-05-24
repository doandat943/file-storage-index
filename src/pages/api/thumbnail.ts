import type { NextApiRequest, NextApiResponse } from 'next'
import { posix as pathPosix } from 'path'
import fs from 'fs'
import { promisify } from 'util'
// @ts-ignore
import sharp from 'sharp'
// @ts-ignore
import * as mm from 'music-metadata'
import { checkAuthRoute, encodePath } from '.'
import apiConfig from '../../../config/api.config'
import { getExtension } from '../../utils/getFileIcon'
import { readFileContent, resolveFilePath } from '../../utils/fileSystemHandler'

// Promisify fs functions
const fsExists = promisify(fs.exists)
const fsStat = promisify(fs.stat)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get item thumbnails by its path since we will later check if it is protected
  const { path = '', size = 'medium', odpt = '' } = req.query

  // Set edge function caching for faster load times, if route is not protected
  if (odpt === '') res.setHeader('Cache-Control', apiConfig.cacheControlHeader)

  // Check whether the size is valid - must be one of 'large', 'medium', or 'small'
  if (size !== 'large' && size !== 'medium' && size !== 'small') {
    res.status(400).json({ error: 'Invalid size' })
    return
  }
  
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
  
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))

  const { code, message } = await checkAuthRoute(cleanPath, odpt as string)
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
  const absolutePath = resolveFilePath(requestPath)
  
  try {
    // Check if file exists
    if (!await fsExists(absolutePath)) {
      res.status(404).json({ error: 'File not found.' })
      return
    }
    
    // Get file stats
    const stats = await fsStat(absolutePath)
    if (stats.isDirectory()) {
      res.status(400).json({ error: 'Directories do not have thumbnails.' })
      return
    }
    
    // Get file extension
    const extension = getExtension(absolutePath).toLowerCase()
    
    // Define size dimensions
    const sizeMap = {
      small: 96,
      medium: 176,
      large: 300
    }
    const dimension = sizeMap[size as keyof typeof sizeMap]
    
    // Process based on file type
    if (['mp3', 'flac', 'ogg', 'm4a', 'wav'].includes(extension)) {
      let imageBuffer: Buffer | null = null;
      const fileBuffer = await readFileContent(requestPath);
      
      // Use music-metadata for all audio formats
      try {
        const metadata = await mm.parseBuffer(fileBuffer as unknown as Uint8Array);
        
        // Extract picture if available
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          imageBuffer = Buffer.from(metadata.common.picture[0].data);
        }
      } catch (error) {
        console.error('Error extracting metadata:', error);
      }
      
      // If we have album art, resize and return it
      if (imageBuffer) {
        const resizedImage = await sharp(imageBuffer as unknown as Uint8Array)
          .resize(dimension, dimension, { fit: 'inside' })
          .toBuffer();
        
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(resizedImage);
        return;
      }
      
      // If no album art, return error to show default icon
      res.status(400).json({ error: "The item doesn't have a valid thumbnail." });
      return;
      
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      // For image files, read and resize
      const imageBuffer = await readFileContent(requestPath)
      const resizedImage = await sharp(imageBuffer)
        .resize(dimension, dimension, { fit: 'inside' })
        .toBuffer()
      
      res.setHeader('Content-Type', `image/${extension === 'jpg' ? 'jpeg' : extension}`)
      res.send(resizedImage)
      return
      
    } else if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(extension)) {
      // For video files, we would ideally extract a frame - for now use a placeholder
      const placeholderImage = await sharp({
        create: {
          width: dimension,
          height: Math.floor(dimension * 0.5625),  // 16:9 aspect ratio
          channels: 4,
          background: { r: 40, g: 40, b: 40, alpha: 1 }
        }
      })
      .jpeg()
      .toBuffer()
      
      res.setHeader('Content-Type', 'image/jpeg')
      res.send(placeholderImage)
      return
      
    } else {
      // For other file types, return a blank thumbnail
      res.status(400).json({ error: "The item doesn't have a valid thumbnail." })
      return
    }
    
  } catch (error: any) {
    console.error('Error generating thumbnail:', error)
    res.status(500).json({ error: 'Internal server error.' })
    return
  }
}

import { posix as pathPosix } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { writeFile } from '../../utils/fileSystemHandler'
import siteConfig from '../../../config/site.config'
import { checkAuthRoute, encodePath } from '.'

export const config = {
  api: {
    bodyParser: false,
  },
}

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

  // Parse the multipart form data
  const form = formidable({
    multiples: true,
    keepExtensions: true,
  })

  try {
    // Modern formidable returns a promise directly
    const formData = await new Promise<{fields: formidable.Fields; files: formidable.Files}>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err)
        resolve({ fields, files })
      })
    })

    const { files } = formData
    const uploadedFiles = Array.isArray(files.files) ? files.files : (files.files ? [files.files] : [])
    const results: Array<{ name: string; size: number; path: string }> = []

    // Process each uploaded file
    for (const file of uploadedFiles) {
      if (!file) continue

      const uploadPath = encodePath(cleanPath)
      const filePath = pathPosix.join(uploadPath, file.originalFilename || 'unnamed_file')

      // Read file content
      const content = await fs.promises.readFile(file.filepath)

      // Write file to storage
      await writeFile(filePath, content)

      results.push({
        name: file.originalFilename || 'unnamed_file',
        size: file.size,
        path: filePath,
      })
    }

    res.status(200).json({ success: true, files: results })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ error: 'Error uploading file' })
  }
} 
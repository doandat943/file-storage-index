// API response object for /api/?path=<path_to_file_or_folder>, this may return either a file or a folder.
// Pagination is also declared here with the 'next' parameter.
export type APIResponse = { file?: FileObject; folder?: FolderObject; next?: string }

// Folder object representing a directory in the file system
export type FolderObject = {
  path: string
  name: string
  value: Array<{
    id: string
    name: string
    size: number
    lastModifiedDateTime: string
    file?: { mimeType: string }
    folder?: { childCount: number }
    image?: ImageFile
    video?: VideoFile
  }>
}

export type FolderChildren = FolderObject['value'][number]

// File object representing a file in the file system
export type FileObject = {
  name: string
  size: number
  id: string
  path: string
  lastModifiedDateTime: string
  file: { 
    mimeType: string 
  }
  image?: ImageFile
  video?: VideoFile
}

// A representation of an image file with metadata
export type ImageFile = {
  width?: number
  height?: number
}

// A representation of a video file with metadata
export type VideoFile = {
  width?: number
  height?: number
  duration?: number
}

// Thumbnail representation for media files
export type Thumbnail = {
  id: string
  large?: { height: number; width: number; url: string }
  medium?: { height: number; width: number; url: string }
  small?: { height: number; width: number; url: string }
}

// API response object for /api/search/?q=<query>
export type SearchResult = Array<{
  id: string
  name: string
  path: string
  size: number
  lastModifiedDateTime: string
  file?: { 
    mimeType: string 
  }
  folder?: { 
    childCount: number 
  }
}>

// Item reference by ID
export type DriveItem = {
  id: string
  name: string
  path: string
  parentPath: string
}

// Stream result for file streaming
export type StreamResult = {
  stream: NodeJS.ReadableStream
  contentLength: number
  mimeType: string
  fileName: string
}

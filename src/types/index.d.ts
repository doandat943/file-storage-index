// Type definitions for the application

export type OdAPIResponse = { file?: OdFileObject; folder?: OdFolderObject; next?: string }

export type OdFolderObject = {
  '@odata.count': number
  '@odata.context': string
  '@odata.nextLink'?: string
  value: Array<{
    id: string
    name: string
    size: number
    lastModifiedDateTime: string
    file?: {
      mimeType: string
      hashes: {
        quickXorHash?: string
        sha1Hash?: string
        sha256Hash?: string
      }
    }
    folder?: {
      childCount: number
      view: {
        sortBy: string
        sortOrder: 'ascending' | 'descending'
        viewType: 'thumbnails' | 'list'
      }
    }
    image?: {
      width?: number
      height?: number
    }
    video?: {
      width?: number
      height?: number
      duration?: number
      bitrate?: number
      frameRate?: number
      audioBitsPerSample?: number
      audioChannels?: number
      audioFormat?: string
      audioSamplesPerSecond?: number
    }
    thumbnailPath?: string
  }>
}

export type OdFolderChildren = OdFolderObject['value'][number]

// File object definition
export type OdFileObject = {
  '@odata.context': string
  name: string
  size: number
  id: string
  lastModifiedDateTime: string
  file: {
    mimeType: string
    hashes: {
      quickXorHash?: string
      sha1Hash?: string
      sha256Hash?: string
    }
  }
  image?: {
    width?: number
    height?: number
  }
  video?: {
    width?: number
    height?: number
    duration?: number
    bitrate?: number
    frameRate?: number
    audioBitsPerSample?: number
    audioChannels?: number
    audioFormat?: string
    audioSamplesPerSecond?: number
  }
  thumbnailPath?: string
  path?: string
  webUrl?: string
  parentReference?: {
    driveId?: string
    driveType?: string
    id?: string
    path?: string
    siteId?: string
  }
}

// Image file representation. Some images do not return a width and height, so types are optional.
export type OdImageFile = {
  width?: number
  height?: number
}

// Video file representation. All fields are declared here, mainly used for video playback.
export type OdVideoFile = {
  width: number
  height: number
  duration: number
  bitrate: number
  frameRate: number
  audioBitsPerSample: number
  audioChannels: number
  audioFormat: string
  audioSamplesPerSecond: number
}

// Thumbnail format
export type OdThumbnail = {
  id: string
  large: {
    height: number
    width: number
    url: string
  }
  medium: {
    height: number
    width: number
    url: string
  }
  small: {
    height: number
    width: number
    url: string
  }
}

// Search results
export type OdSearchResult = Array<{
  id: string
  name: string
  file?: {
    mimeType: string
    hashes: {
      quickXorHash?: string
      sha1Hash?: string
      sha256Hash?: string
    }
  }
  folder?: {
    childCount: number
    view: {
      sortBy: string
      sortOrder: 'ascending' | 'descending'
      viewType: 'thumbnails' | 'list'
    }
  }
  path: string
  parentReference: {
    driveId?: string
    driveType?: string
    id?: string
    path?: string
    siteId?: string
  }
}>

// Item definition
export type OdDriveItem = {
  '@odata.context': string
  '@odata.etag': string
  id: string
  name: string
  parentReference: {
    driveId: string
    driveType: string
    id: string
    path: string
  }
}

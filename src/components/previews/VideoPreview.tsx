import { FC, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import CustomEmbedLinkMenu from '../CustomEmbedLinkMenu'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import { getBaseUrl } from '../../utils/getBaseUrl'
import { LoadingIcon } from '../Loading'

enum PlayerState {
  Loading = 0,
  Ready = 1,
  Playing = 2,
  Paused = 3,
}

interface VideoPreviewProps {
  file: any
  proxy?: boolean
  path: string
}

const VideoPreview: FC<VideoPreviewProps> = ({ file, path, proxy = false }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const { t } = useTranslation()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  const [playerStatus, setPlayerStatus] = useState(PlayerState.Loading)
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)
  
  // Correctly construct the video URL - don't include file.name since it's already in the path
  const proxyUrl = proxy ? '/api/proxy?url=' : '/api/raw?path='
  const videoUrl = `${getBaseUrl()}${proxyUrl}${encodeURIComponent(
    proxy ? `${file['@microsoft.graph.downloadUrl']}` : path
  )}${proxy ? '' : hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Set iframe URL for embedded player which uses less memory
  const iframeUrl = `/api/embed?url=${encodeURIComponent(videoUrl)}&type=video&title=${encodeURIComponent(file.name)}`
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsIframeLoaded(true)
    setPlayerStatus(PlayerState.Ready)
  }

  // Handle messages from iframe to update player state
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'playerStatus') {
        setPlayerStatus(event.data.status)
      }
    }
    
    window.addEventListener('message', handleIframeMessage)
    return () => {
      window.removeEventListener('message', handleIframeMessage)
    }
  }, [])

  return (
    <>
      <PreviewContainer>
        <div className="flex h-full w-full items-center justify-center">
          <div className="relative w-full h-0 pb-[56.25%]">
            {playerStatus === PlayerState.Loading && !isIframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <LoadingIcon className="h-10 w-10 animate-spin text-white" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className="absolute top-0 left-0 w-full h-full border-0"
              title={file.name}
              allowFullScreen
              loading="lazy"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
        <CustomEmbedLinkMenu 
          path={videoUrl} 
          menuOpen={false} 
          setMenuOpen={() => {}} 
        />
      </DownloadBtnContainer>
    </>
  )
}

export default VideoPreview

import type { OdFileObject } from '../../types'
import { FC, useRef, useState, useEffect } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import { LoadingIcon } from '../Loading'
import { formatModifiedDateTime } from '../../utils/fileDetails'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import { getBaseUrl } from '../../utils/getBaseUrl'

enum PlayerState {
  Loading = 0,
  Ready = 1,
  Playing = 2,
  Paused = 3,
}

const AudioPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { t } = useTranslation()
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [playerStatus, setPlayerStatus] = useState(PlayerState.Loading)
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)

  // Render audio thumbnail, and also check for broken thumbnails
  const thumbnail = `/api/thumbnail/?path=${asPath}&size=medium${hashedToken ? `&odpt=${hashedToken}` : ''}`
  const [brokenThumbnail, setBrokenThumbnail] = useState(false)

  // Construct the audio URL
  const audioUrl = `${getBaseUrl()}/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`
  
  // Set iframe URL for embedded player which uses less memory
  const iframeUrl = `/api/embed?url=${encodeURIComponent(audioUrl)}&type=audio&title=${encodeURIComponent(file.name)}`

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
        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4">
          <div className="relative flex aspect-square w-full items-center justify-center rounded bg-gray-100 transition-all duration-75 dark:bg-gray-700 md:w-48">
            <div
              className={`absolute z-20 flex h-full w-full items-center justify-center transition-all duration-300 ${
                playerStatus === PlayerState.Loading && !isIframeLoaded
                  ? 'bg-white opacity-80 dark:bg-gray-800'
                  : 'bg-transparent opacity-0'
              }`}
            >
              <LoadingIcon className="z-10 inline-block h-5 w-5 animate-spin" />
            </div>

            {!brokenThumbnail ? (
              <div className="absolute m-4 aspect-square rounded-full shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={`h-full w-full rounded-full object-cover object-top ${
                    playerStatus === PlayerState.Playing ? 'animate-spin-slow' : ''
                  }`}
                  src={thumbnail}
                  alt={file.name}
                  onError={() => setBrokenThumbnail(true)}
                />
              </div>
            ) : (
              <FontAwesomeIcon
                className={`z-10 h-5 w-5 ${playerStatus === PlayerState.Playing ? 'animate-spin' : ''}`}
                icon="music"
                size="2x"
              />
            )}
          </div>

          <div className="flex w-full flex-col justify-between">
            <div>
              <div className="mb-2 font-medium">{file.name}</div>
              <div className="mb-4 text-sm text-gray-500">
                {t('Last modified:') + ' ' + formatModifiedDateTime(file.lastModifiedDateTime)}
              </div>
            </div>

            <div className="h-16 w-full">
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                className="w-full h-full border-0"
                title={file.name}
                onLoad={handleIframeLoad}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </PreviewContainer>

      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </>
  )
}

export default AudioPreview

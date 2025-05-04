import { FC, useEffect, useState, memo } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import axios from 'axios'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { useAsync } from 'react-async-hook'
import { useClipboard } from 'use-clipboard-copy'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import CustomEmbedLinkMenu from '../CustomEmbedLinkMenu'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import { getBaseUrl } from '../../utils/getBaseUrl'
import { LoadingIcon } from '../Loading'
import { getExtension } from '../../utils/getFileIcon'

// Thay thế cách sử dụng Plyr để tránh lỗi
// Sử dụng video HTML gốc để xem video

interface VideoPreviewProps {
  file: any
  proxy?: boolean
  path: string
}

const VideoPlayer = dynamic(() => import('./VideoPlayerComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingIcon className="h-10 w-10 animate-spin" />
    </div>
  ),
})

const VideoPreview: FC<VideoPreviewProps> = ({ file, path, proxy = false }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const { t } = useTranslation()
  const clipboard = useClipboard()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Xây dựng URL cho video và thumbnail
  const proxyUrl = proxy ? '/api/proxy?url=' : '/api/raw?path='
  const videoUrl = `${getBaseUrl()}${proxyUrl}${encodeURIComponent(
    proxy ? `${file['@microsoft.graph.downloadUrl']}` : path
  )}${proxy ? '' : hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Thumbnail cho video
  const thumbnail = `/api/thumbnail/?path=${asPath}&size=large${hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Phụ đề cho video (giả định phụ đề có cùng tên với video, định dạng .vtt)
  const vtt = `${asPath.substring(0, asPath.lastIndexOf('.'))}.vtt`
  const subtitle = `/api/raw/?path=${vtt}${hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Kiểm tra xem video có phải là định dạng FLV không
  const isFlv = getExtension(file.name) === 'flv'
  const {
    loading,
    error,
    result: mpegts,
  } = useAsync(async () => {
    if (isFlv && typeof window !== 'undefined') {
      return (await import('mpegts.js')).default
    }
    return null
  }, [isFlv])

  // Render video player
  return (
    <>
      <PreviewContainer>
        {!isClient ? (
          <div className="flex h-full w-full items-center justify-center">
            <LoadingIcon className="h-10 w-10 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex h-full w-full items-center justify-center text-red-500">
            <p>{error.message}</p>
          </div>
        ) : loading && isFlv ? (
          <div className="flex h-full w-full items-center justify-center">
            <LoadingIcon className="h-10 w-10 animate-spin" />
            <span className="ml-2">{t('Loading FLV extension...')}</span>
          </div>
        ) : (
          <VideoPlayer
            videoName={file.name}
            videoUrl={videoUrl}
            width={file.video?.width}
            height={file.video?.height}
            thumbnail={thumbnail}
            subtitle={subtitle}
            isFlv={isFlv}
            mpegts={mpegts}
          />
        )}
      </PreviewContainer>
      
      <DownloadBtnContainer>
        <div className="flex flex-wrap justify-center gap-2">
          <DownloadButtonGroup />
          
          <button
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            onClick={() => window.open(videoUrl)}
          >
            {t('Download')}
          </button>
          
          <button
            className="rounded bg-pink-500 px-4 py-2 text-white hover:bg-pink-600"
            onClick={() => {
              clipboard.copy(`${getBaseUrl()}/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`)
              toast.success(t('Copied direct link to clipboard.'))
            }}
          >
            {t('Copy direct link')}
          </button>
          
          <button
            className="rounded bg-teal-500 px-4 py-2 text-white hover:bg-teal-600"
            onClick={() => setMenuOpen(true)}
          >
            {t('Customize link')}
          </button>
          
          {isClient && (
            <>
              {/* External player buttons */}
              <button
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={() => window.open(`vlc://${getBaseUrl()}${videoUrl}`)}
              >
                VLC
              </button>
              
              <button
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={() => window.open(`potplayer://${getBaseUrl()}${videoUrl}`)}
              >
                PotPlayer
              </button>
            </>
          )}
        </div>
        
        <CustomEmbedLinkMenu 
          path={videoUrl} 
          menuOpen={menuOpen} 
          setMenuOpen={setMenuOpen} 
        />
      </DownloadBtnContainer>
    </>
  )
}

export default memo(VideoPreview)

import { FC, memo, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { useClipboard } from 'use-clipboard-copy'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import CustomEmbedLinkMenu from '../CustomEmbedLinkMenu'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import { getBaseUrl } from '../../utils/getBaseUrl'
import { LoadingIcon } from '../Loading'

// Import AudioPlayerComponent
// Sử dụng audio HTML gốc để phát âm thanh
const AudioPlayer = dynamic(() => import('./AudioPlayerComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingIcon className="h-10 w-10 animate-spin" />
    </div>
  ),
})

interface AudioPreviewProps {
  file: any
  proxy?: boolean
  path: string
}

const AudioPreview: FC<AudioPreviewProps> = ({ file, path, proxy = false }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const { t } = useTranslation()
  const clipboard = useClipboard()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Xây dựng URL cho audio
  const proxyUrl = proxy ? '/api/proxy?url=' : '/api/raw?path='
  const audioUrl = `${getBaseUrl()}${proxyUrl}${encodeURIComponent(
    proxy ? `${file['@microsoft.graph.downloadUrl']}` : path
  )}${proxy ? '' : hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Thumbnail for audio (nếu có)
  const thumbnail = `/api/thumbnail/?path=${asPath}&size=large${hashedToken ? `&odpt=${hashedToken}` : ''}`

  return (
    <>
      <PreviewContainer>
        <div className="w-full max-w-3xl mx-auto p-4">
          {!isClient ? (
            <div className="flex h-full w-full items-center justify-center">
              <LoadingIcon className="h-10 w-10 animate-spin" />
            </div>
          ) : (
            <AudioPlayer
              audioName={file.name}
              audioUrl={audioUrl}
              thumbnail={thumbnail}
            />
          )}
        </div>
      </PreviewContainer>

      <DownloadBtnContainer>
        <div className="flex flex-wrap justify-center gap-2">
          <DownloadButtonGroup />
          
          <button
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            onClick={() => window.open(audioUrl)}
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
        </div>
        
        <CustomEmbedLinkMenu 
          path={audioUrl} 
          menuOpen={menuOpen} 
          setMenuOpen={setMenuOpen} 
        />
      </DownloadBtnContainer>
    </>
  )
}

export default memo(AudioPreview)

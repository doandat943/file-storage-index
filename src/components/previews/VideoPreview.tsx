import { FC, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import Hls from 'hls.js'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import CustomEmbedLinkMenu from '../CustomEmbedLinkMenu'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import FourOhFour from '../FourOhFour'
import Loading from '../Loading'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import { getBaseUrl } from '../../utils/getBaseUrl'
import useFileContent from '../../utils/fetchOnMount'
import { fetcher } from '../../utils/fetchWithSWR'

// Import Plyr with SSR disabled (client-side only)
const Plyr = dynamic(() => import('plyr'), { ssr: false })

interface VideoPreviewProps {
  file: any
  proxy?: boolean
  path: string
}

declare let document: Document

// This component handles subtitles, videos with HLS, and FLV videos
const VideoPlayer: FC<{ videoPlayerRef: any; src: string; subtitles: string[]; fileName: string; proxy: boolean }> = ({
  videoPlayerRef,
  src,
  subtitles,
  fileName,
  proxy,
}) => {
  const { t } = useTranslation()
  const [plyrInitialized, setPlyrInitialized] = useState(false)

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') return

    // Workaround for Plyr muted state not working
    const video = videoPlayerRef.current
    if (video) {
      video.muted = true
    }

    // Load subtitle tracks
    if (subtitles.length > 0) {
      for (let i = 0; i < subtitles.length; i++) {
        const track = document.createElement('track')
        track.kind = 'captions'
        track.label = `${subtitles[i].split('.').at(-1)?.toUpperCase() ?? t('Subtitle')} ${i + 1}`
        track.srclang = `${subtitles[i].split('.').at(-1) ?? 'en'}`
        track.src = `${proxy ? '/api/proxy?' : '/api/raw/?path='}${subtitles[i]}`
        track.addEventListener('load', () => {
          track.mode = 'showing'
          video.textTracks[i].mode = 'showing'
        })
        video.appendChild(track)
      }
    }

    // Handle FLV videos
    if (fileName.endsWith('.flv') && typeof window !== 'undefined') {
      import('flv.js').then(({ default: flvjs }) => {
        if (flvjs.isSupported() && video) {
          const flvPlayer = flvjs.createPlayer({
            type: 'flv',
            url: src,
          })
          flvPlayer.attachMediaElement(video)
          flvPlayer.load()
        }
      })
    }

    // Initialize Plyr if not initialized
    if (!plyrInitialized && videoPlayerRef.current) {
      const plyrOptions = {
        keyboard: { global: true },
        tooltips: { controls: true, seek: true },
        captions: { active: true, language: 'auto', update: true },
      }
      
      const player = new Plyr(videoPlayerRef.current, plyrOptions)
      setPlyrInitialized(true)
      
      return () => {
        player.destroy()
      }
    }
  }, [videoPlayerRef, src, subtitles, fileName, proxy, plyrInitialized, t])

  return (
    <video
      ref={videoPlayerRef}
      className="plyr-react plyr"
      crossOrigin="anonymous"
      preload="metadata"
      controls
      playsInline
    >
      <source src={src} type="video/mp4" />
      {subtitles.length === 0 && <track kind="captions" />}
    </video>
  )
}

const VideoPreview: FC<VideoPreviewProps> = ({ file, path, proxy = false }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)

  const router = useRouter()
  const { t } = useTranslation()
  const videoPlayerRef = useRef<HTMLVideoElement>(null)

  const proxyUrl = proxy ? '/api/proxy?url=' : '/api/raw?path='
  const videoUrl = `${getBaseUrl()}${proxyUrl}${encodeURIComponent(
    proxy ? `${file['@microsoft.graph.downloadUrl']}` : `${path}/${file.name}`
  )}${proxy ? '' : hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Only load subtitle files in the same folder with the same name as the video
  const { response: folderChildren } = useFileContent(path, path)
  const [subtitles, setSubtitles] = useState<string[]>([])

  useEffect(() => {
    if (folderChildren) {
      const subtitleExts = ['srt', 'vtt', 'ass']
      const baseName = file.name.split('.').slice(0, -1).join('.')

      const filteredSubtitles = folderChildren
        .filter(
          child =>
            child.name.startsWith(baseName) &&
            subtitleExts.includes(child.name.split('.').pop() as string)
        )
        .map(child => `${path}/${child.name}`)

      setSubtitles(filteredSubtitles)
    }
  }, [folderChildren, file.name, path])

  // Handle HLS stream directly with hls.js
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      Hls.isSupported() &&
      videoPlayerRef.current &&
      file.name.endsWith('.m3u8')
    ) {
      const hls = new Hls()
      hls.loadSource(videoUrl)
      hls.attachMedia(videoPlayerRef.current)
    }
  }, [videoUrl, file.name])

  return (
    <>
      <PreviewContainer>
        <div className="aspect-video w-full">
          <VideoPlayer
            videoPlayerRef={videoPlayerRef}
            src={videoUrl}
            subtitles={subtitles}
            fileName={file.name}
            proxy={proxy}
          />
        </div>
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
        <CustomEmbedLinkMenu path={videoUrl} />
      </DownloadBtnContainer>
    </>
  )
}

export default VideoPreview

import type { OdFileObject } from '../../types'

import { FC, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'

import axios from 'axios'
import toast from 'react-hot-toast'
import { useAsync } from 'react-async-hook'
import { useClipboard } from 'use-clipboard-copy'

import { getBaseUrl } from '../../utils/getBaseUrl'
import { getExtension } from '../../utils/getFileIcon'
import { getStoredToken } from '../../utils/protectedRouteHandler'

import { DownloadButton } from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import FourOhFour from '../FourOhFour'
import Loading from '../Loading'
import CustomEmbedLinkMenu from '../CustomEmbedLinkMenu'

// Dynamic import of Plyr with ssr: false to ensure it's only loaded on the client side
const Plyr = dynamic(() => import('plyr-react'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
    <Loading loadingText="Loading video player..." />
  </div>
})

// Import Plyr CSS
import 'plyr-react/plyr.css'

const VideoPlayer: FC<{
  videoName: string
  videoUrl: string
  width?: number
  height?: number
  thumbnail: string
  subtitle: string
  isFlv: boolean
  mpegts: any
}> = ({ videoName, videoUrl, width, height, thumbnail, subtitle, isFlv, mpegts }) => {
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef(null);

  // Verify subtitle validity before adding to config
  const [validSubtitle, setValidSubtitle] = useState(false);
  
  useEffect(() => {
    // Check if subtitle file exists
    if (subtitle) {
      const checkSubtitle = async () => {
        try {
          const response = await fetch(subtitle, { method: 'HEAD' });
          setValidSubtitle(response.ok);
        } catch (e) {
          console.log('Subtitle file not found or inaccessible');
          setValidSubtitle(false);
        }
      };
      checkSubtitle();
    }
  }, [subtitle]);

  // FLV handling with mpegts.js
  useEffect(() => {
    if (isFlv && mpegts && playerReady) {
      try {
        // Get the video element after Plyr is initialized
        const video = document.getElementById('plyr');
        if (video) {
          const flvPlayer = mpegts.createPlayer({ 
            url: videoUrl, 
            type: 'flv' 
          });
          flvPlayer.attachMediaElement(video);
          flvPlayer.load();
          
          return () => {
            flvPlayer.destroy();
          };
        }
      } catch (err) {
        console.error('FLV player error:', err);
        setError('Failed to initialize FLV player');
      }
    }
  }, [videoUrl, isFlv, mpegts, playerReady]);

  // Handle component mount/unmount
  useEffect(() => {
    setPlayerReady(true);
    
    return () => {
      setPlayerReady(false);
    };
  }, []);

  if (error) {
    return <div className="w-full h-full flex items-center justify-center text-red-500">
      <p>{error}</p>
    </div>;
  }

  // Common plyr configs, including the video source and plyr options
  const plyrSource: any = {
    type: 'video',
    title: videoName,
  };
  
  // Only add poster if thumbnail is valid
  if (thumbnail) {
    plyrSource.poster = thumbnail;
  }
  
  // Add optional tracks if subtitle exists and is valid
  if (validSubtitle) {
    plyrSource.tracks = [{ 
      kind: 'captions', 
      label: videoName, 
      src: subtitle, 
      default: true 
    }];
  }
  
  // Safe default ratio if width/height not provided
  const ratio = width && height ? `${width}:${height}` : '16:9';
  
  const plyrOptions: Plyr.Options = {
    ratio,
    fullscreen: { iosNative: true },
    captions: { active: true, update: true },
  };
  
  // Only add sources for non-FLV files
  if (!isFlv) {
    plyrSource.sources = [{ 
      src: videoUrl,
      type: getVideoMimeType(videoName)
    }];
  }
  
  try {
    return <Plyr 
      id="plyr" 
      source={plyrSource as Plyr.SourceInfo} 
      options={plyrOptions} 
      ref={playerRef}
    />;
  } catch (err) {
    console.error('Plyr initialization error:', err);
    return <div className="w-full h-full flex items-center justify-center text-red-500">
      <p>Failed to initialize video player</p>
    </div>;
  }
};

// Helper to determine video MIME type
function getVideoMimeType(filename: string): string {
  const ext = getExtension(filename).toLowerCase();
  const mimeTypes: {[key: string]: string} = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'mkv': 'video/x-matroska',
    'm4v': 'video/mp4'
  };
  
  return mimeTypes[ext] || '';
}

const VideoPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const clipboard = useClipboard()

  const [menuOpen, setMenuOpen] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const { t } = useTranslation()

  // OneDrive generates thumbnails for its video files, we pick the thumbnail with the highest resolution
  const thumbnail = `/api/thumbnail/?path=${asPath}&size=large${hashedToken ? `&odpt=${hashedToken}` : ''}`

  // We assume subtitle files are beside the video with the same name, only webvtt '.vtt' files are supported
  const vtt = `${asPath.substring(0, asPath.lastIndexOf('.'))}.vtt`
  const subtitle = `/api/raw/?path=${vtt}${hashedToken ? `&odpt=${hashedToken}` : ''}`

  // We also format the raw video file for the in-browser player as well as all other players
  const videoUrl = `/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`

  const isFlv = getExtension(file.name) === 'flv'
  const {
    loading,
    error,
    result: mpegts,
  } = useAsync(async () => {
    if (isFlv) {
      try {
        return (await import('mpegts.js')).default;
      } catch (err) {
        console.error('Failed to load mpegts.js:', err);
        setPlayerError('Failed to load FLV player module');
        return null;
      }
    }
    return null;
  }, [isFlv])

  return (
    <>
      <CustomEmbedLinkMenu path={asPath} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <PreviewContainer>
        {error || playerError ? (
          <FourOhFour errorMsg={error?.message || playerError || 'Failed to initialize video player'} />
        ) : loading && isFlv ? (
          <Loading loadingText={t('Loading FLV extension...')} />
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
          <DownloadButton
            onClickCallback={() => window.open(videoUrl)}
            btnColor="blue"
            btnText={t('Download')}
            btnIcon="file-download"
          />
          <DownloadButton
            onClickCallback={() => {
              clipboard.copy(`${getBaseUrl()}/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`)
              toast.success(t('Copied direct link to clipboard.'))
            }}
            btnColor="pink"
            btnText={t('Copy direct link')}
            btnIcon="copy"
          />
          <DownloadButton
            onClickCallback={() => setMenuOpen(true)}
            btnColor="teal"
            btnText={t('Customise link')}
            btnIcon="pen"
          />

          <DownloadButton
            onClickCallback={() => window.open(`iina://weblink?url=${getBaseUrl()}${videoUrl}`)}
            btnText="IINA"
            btnImage="/players/iina.png"
          />
          <DownloadButton
            onClickCallback={() => window.open(`vlc://${getBaseUrl()}${videoUrl}`)}
            btnText="VLC"
            btnImage="/players/vlc.png"
          />
          <DownloadButton
            onClickCallback={() => window.open(`potplayer://${getBaseUrl()}${videoUrl}`)}
            btnText="PotPlayer"
            btnImage="/players/potplayer.png"
          />
          <DownloadButton
            onClickCallback={() => window.open(`nplayer-http://${window?.location.hostname ?? ''}${videoUrl}`)}
            btnText="nPlayer"
            btnImage="/players/nplayer.png"
          />
        </div>
      </DownloadBtnContainer>
    </>
  )
}

export default VideoPreview

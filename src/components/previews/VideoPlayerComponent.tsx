import { FC, useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { LoadingIcon } from '../Loading'
import dynamic from 'next/dynamic'

// Import Plyr với dynamic import để tránh lỗi SSR
const Plyr = dynamic(() => import('plyr-react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingIcon className="h-10 w-10 animate-spin" />
    </div>
  ),
});

// Import stylesheet - chỉ trên client
const PlyrCSS = dynamic(() => 
  import('plyr/dist/plyr.css').then(() => ({ default: () => null })),
  { ssr: false }
);

interface VideoPlayerProps {
  videoName: string
  videoUrl: string
  width?: number
  height?: number
  thumbnail: string
  subtitle: string
  isFlv: boolean
  mpegts: any
}

const VideoPlayerComponent: FC<VideoPlayerProps> = ({
  videoName,
  videoUrl,
  width,
  height,
  thumbnail,
  subtitle,
  isFlv,
  mpegts
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Xử lý FLV nếu cần
  useEffect(() => {
    if (isFlv && mpegts && videoRef.current) {
      try {
        const flv = mpegts.createPlayer({
          url: videoUrl,
          type: 'flv'
        });
        flv.attachMediaElement(videoRef.current);
        flv.load();
        setLoading(false);
        
        // Cleanup FLV player
        return () => {
          flv.destroy();
        };
      } catch (err) {
        console.error('FLV error:', err);
        setError('Không thể tải video FLV');
        setLoading(false);
      }
    }
  }, [isFlv, mpegts, videoUrl, videoRef]);
  
  // Xử lý phụ đề
  useEffect(() => {
    const loadSubtitle = async () => {
      if (subtitle) {
        try {
          const response = await axios.get(subtitle, { responseType: 'blob' });
          const subtitleBlob = new Blob([response.data], { type: 'text/vtt' });
          const url = URL.createObjectURL(subtitleBlob);
          setSubtitleUrl(url);
        } catch (error) {
          console.log('Could not load subtitle.', error);
        }
      }
    };
    
    loadSubtitle();
    
    return () => {
      if (subtitleUrl) {
        URL.revokeObjectURL(subtitleUrl);
      }
    };
  }, [subtitle]);
  
  // Đặt timeout chống loading quá lâu
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loading]);
  
  // Theo dõi khi Plyr được load và DOM tạo xong
  useEffect(() => {
    if (playerRef.current) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [playerRef.current]);
  
  // Tạo cấu hình Plyr
  const plyrOptions = {
    controls: [
      'play-large',
      'play', 
      'progress', 
      'current-time',
      'mute', 
      'volume', 
      'captions', 
      'settings', 
      'pip', 
      'airplay', 
      'fullscreen'
    ],
    settings: ['captions', 'quality', 'speed', 'loop'],
    i18n: {
      restart: 'Restart',
      rewind: 'Rewind {seektime}s',
      play: 'Play',
      pause: 'Pause',
      fastForward: 'Forward {seektime}s',
      seek: 'Seek',
      seekLabel: '{currentTime} of {duration}',
      played: 'Played',
      buffered: 'Buffered',
      currentTime: 'Current time',
      duration: 'Duration',
      volume: 'Volume',
      mute: 'Mute',
      unmute: 'Unmute',
      enableCaptions: 'Enable captions',
      disableCaptions: 'Disable captions',
      download: 'Download',
      enterFullscreen: 'Enter fullscreen',
      exitFullscreen: 'Exit fullscreen',
      frameTitle: 'Player for {title}',
      captions: 'Captions',
      settings: 'Settings',
      menuBack: 'Go back to previous menu',
      speed: 'Speed',
      normal: 'Normal',
      quality: 'Quality',
      loop: 'Loop',
    },
    tooltips: { controls: true, seek: true },
    loadSprite: true,
    iconUrl: '/plyr.svg',
    blankVideo: '/blank.mp4',
    autoplay: false,
    poster: thumbnail,
    previewThumbnails: {
      enabled: false,
    },
  };
  
  // Tạo sources
  const sources: any = {
    type: 'video',
    sources: [
      {
        src: videoUrl,
        type: videoUrl.includes('.mp4') ? 'video/mp4' : 
              videoUrl.includes('.webm') ? 'video/webm' : 
              videoUrl.includes('.m3u8') ? 'application/x-mpegURL' : 
              'video/mp4',
      },
    ],
  };
  
  // Thêm phụ đề nếu có
  if (subtitleUrl) {
    sources.tracks = [
      {
        kind: 'captions',
        label: 'Subtitles',
        srclang: 'en',
        src: subtitleUrl,
        default: true,
      },
    ];
  }
  
  return (
    <div ref={containerRef} className="w-full h-full relative">
      <PlyrCSS />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <LoadingIcon className="h-10 w-10 animate-spin text-white" />
        </div>
      )}
      
      {error ? (
        <div className="flex h-full w-full items-center justify-center text-red-500">
          <p>{error}</p>
        </div>
      ) : isFlv ? (
        // Sử dụng video HTML thông thường cho FLV
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          preload="auto"
          poster={thumbnail}
          playsInline
          style={{ aspectRatio: width && height ? `${width}/${height}` : '16/9' }}
          onCanPlay={() => setLoading(false)}
          onLoadedData={() => setLoading(false)}
          onError={() => {
            setError('Không thể phát video');
            setLoading(false);
          }}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        // Sử dụng Plyr cho các định dạng khác
        <div
          className="aspect-video w-full"
          style={{
            aspectRatio: width && height ? `${width}/${height}` : '16/9',
          }}
        >
          <Plyr
            ref={playerRef}
            source={sources}
            options={plyrOptions}
          />
        </div>
      )}
    </div>
  )
}

export default VideoPlayerComponent 
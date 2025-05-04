import { FC, useEffect, useState, useRef } from 'react'
import { LoadingIcon } from '../Loading'
import dynamic from 'next/dynamic'

// Import Plyr với dynamic import để tránh lỗi SSR
const Plyr = dynamic(() => import('plyr-react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingIcon className="h-8 w-8 animate-spin" />
    </div>
  ),
});

// Import stylesheet - chỉ trên client
const PlyrCSS = dynamic(() => 
  import('plyr/dist/plyr.css').then(() => ({ default: () => null })),
  { ssr: false }
);

interface AudioPlayerProps {
  audioName: string
  audioUrl: string
  thumbnail?: string
}

const AudioPlayerComponent: FC<AudioPlayerProps> = ({
  audioName,
  audioUrl,
  thumbnail
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<any>(null)
  
  // Đặt timeout chống loading quá lâu
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 3000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loading]);
  
  // Theo dõi khi Plyr được load
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
      'play',
      'progress', 
      'current-time',
      'mute', 
      'volume'
    ],
    settings: ['speed'],
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
      download: 'Download',
      settings: 'Settings',
      menuBack: 'Go back to previous menu',
      speed: 'Speed',
      normal: 'Normal'
    },
    tooltips: { controls: true, seek: true },
    loadSprite: true,
    iconUrl: '/plyr.svg',
    blankVideo: '/blank.mp4',
    autoplay: false
  };
  
  // Tạo sources
  const sources: any = {
    type: 'audio',
    sources: [
      {
        src: audioUrl,
        type: audioUrl.includes('.mp3') ? 'audio/mp3' : 
              audioUrl.includes('.ogg') ? 'audio/ogg' : 
              audioUrl.includes('.wav') ? 'audio/wav' : 
              'audio/mpeg',
      },
    ],
  };
  
  return (
    <div className="w-full audio-player">
      <PlyrCSS />
      
      <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
        {thumbnail && (
          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-md overflow-hidden">
            <img 
              src={thumbnail} 
              alt={audioName} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex flex-col flex-grow">
          <h3 className="text-lg font-medium mb-2">{audioName}</h3>
          
          {loading && (
            <div className="flex items-center justify-center h-12">
              <LoadingIcon className="h-8 w-8 animate-spin" />
            </div>
          )}
          
          {error ? (
            <div className="flex h-12 items-center justify-center text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <div className="rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Plyr
                ref={playerRef}
                source={sources}
                options={plyrOptions}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AudioPlayerComponent 
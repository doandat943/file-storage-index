import { NextApiRequest, NextApiResponse } from 'next'

/**
 * API endpoint to generate an HTML page for embedding videos
 * This approach avoids memory issues by isolating video playback in an iframe
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url, type, title } = req.query

  // Validate input parameters
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' })
  }

  if (!type || (type !== 'video' && type !== 'audio')) {
    return res.status(400).json({ error: 'Type must be video or audio' })
  }

  const decodedUrl = decodeURIComponent(url)
  const mediaTitle = title ? decodeURIComponent(title as string) : 'Media Player'
  
  // Generate minimal HTML for embedding media
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${mediaTitle}</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000;
    }
    .player-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    video, audio {
      max-width: 100%;
      max-height: 100%;
      width: 100%;
      height: ${type === 'video' ? '100%' : 'auto'};
      outline: none;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 30px;
      display: flex;
      gap: 15px;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .player-container:hover .controls {
      opacity: 1;
    }
    button {
      background: none;
      border: none;
      color: white;
      font-size: 14px;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 4px;
    }
    button:hover {
      background: rgba(255,255,255,0.1);
    }
  </style>
</head>
<body>
  <div class="player-container">
    ${
      type === 'video'
        ? `<video id="player" controls autoplay crossorigin="anonymous">
            <source src="${decodedUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>`
        : `<audio id="player" controls autoplay crossorigin="anonymous">
            <source src="${decodedUrl}" type="audio/mpeg">
            Your browser does not support the audio tag.
          </audio>`
    }
    <div class="controls">
      <button id="playPause">Pause</button>
      <button id="speed" data-speed="1">1x</button>
      <button id="fullscreen">Fullscreen</button>
    </div>
  </div>

  <script>
    // Simple player script with memory optimization
    document.addEventListener('DOMContentLoaded', function() {
      const player = document.getElementById('player');
      const playPauseBtn = document.getElementById('playPause');
      const speedBtn = document.getElementById('speed');
      const fullscreenBtn = document.getElementById('fullscreen');
      
      // Player states
      const PlayerState = {
        Loading: 0,
        Ready: 1,
        Playing: 2,
        Paused: 3
      };
      
      // Send player status to parent window
      function sendPlayerStatus(status) {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ 
            type: 'playerStatus', 
            status: status 
          }, '*');
        }
      }
      
      // Load media with lower priority
      player.setAttribute('preload', 'metadata');
      
      // Player event listeners
      player.addEventListener('canplay', function() {
        sendPlayerStatus(PlayerState.Ready);
      });
      
      player.addEventListener('playing', function() {
        sendPlayerStatus(PlayerState.Playing);
        playPauseBtn.textContent = 'Pause';
      });
      
      player.addEventListener('pause', function() {
        sendPlayerStatus(PlayerState.Paused);
        playPauseBtn.textContent = 'Play';
      });
      
      player.addEventListener('waiting', function() {
        sendPlayerStatus(PlayerState.Loading);
      });
      
      player.addEventListener('ended', function() {
        sendPlayerStatus(PlayerState.Paused);
        playPauseBtn.textContent = 'Play';
        player.src = ''; // Clear source when ended
      });
      
      // Memory optimization - release resources when possible
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
          player.pause();
          sendPlayerStatus(PlayerState.Paused);
        }
      });
      
      // Force garbage collection when possible
      window.addEventListener('beforeunload', function() {
        player.src = ''; // Clear source
        player.load(); // Force reload to clear memory
      });
      
      // Simple controls
      playPauseBtn.addEventListener('click', function() {
        if (player.paused) {
          player.play();
        } else {
          player.pause();
        }
      });
      
      // Playback speed control
      speedBtn.addEventListener('click', function() {
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const currentSpeed = parseFloat(speedBtn.getAttribute('data-speed'));
        const currentIndex = speeds.indexOf(currentSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        const nextSpeed = speeds[nextIndex];
        
        player.playbackRate = nextSpeed;
        speedBtn.setAttribute('data-speed', nextSpeed.toString());
        speedBtn.textContent = nextSpeed + 'x';
      });
      
      // Fullscreen control
      fullscreenBtn.addEventListener('click', function() {
        if (type === 'video') {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error(err));
          } else {
            player.requestFullscreen().catch(err => console.error(err));
          }
        }
      });
      
      // Hide fullscreen button for audio
      if (type === 'audio') {
        fullscreenBtn.style.display = 'none';
      }
      
      // Periodically check if player is still active
      const memoryCheckInterval = setInterval(() => {
        if (!document.body.contains(player)) {
          clearInterval(memoryCheckInterval);
          return;
        }
        
        // Check for stalled playback
        if (player.readyState < 3 && !player.paused && Date.now() - player.lastProgressTime > 10000) {
          console.log('Playback stalled, attempting recovery');
          player.load();
          player.play().catch(e => console.error('Recovery failed', e));
        }
      }, 5000);
      
      // Track progress time to detect stalls
      player.lastProgressTime = Date.now();
      player.addEventListener('progress', () => {
        player.lastProgressTime = Date.now();
      });
      
      // Notify parent that iframe is loaded
      window.addEventListener('load', function() {
        sendPlayerStatus(PlayerState.Ready);
      });
    });
  </script>
</body>
</html>
  `

  // Set response headers
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
  res.status(200).send(html)
} 
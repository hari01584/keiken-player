import { Video } from '@/types';
import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player'
import Hls from 'hls.js';

interface VideoPlayerProps {
  currentVideo: Video | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onProgress: (progress: any) => void;
  onDuration: (duration: number) => void;
  playerRef: React.MutableRefObject<ReactPlayer | null>;
  onQualityLevelsChange?: (levels: { value: number; label: string }[]) => void;
  onCurrentQualityChange?: (quality: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  currentVideo,
  isPlaying,
  volume,
  isMuted,
  onPlay,
  onPause,
  onProgress,
  onDuration,
  playerRef,
  onQualityLevelsChange,
  onCurrentQualityChange,
}) => {
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);

  // Reset quality levels when video changes
  useEffect(() => {
    if (onQualityLevelsChange) {
      onQualityLevelsChange([]); 
    }
    if (onCurrentQualityChange) {
      onCurrentQualityChange(-1);
    }

    // Reset retry counter when video changes
    retryCountRef.current = 0;
  }, [currentVideo?.url]);
  
  // Setup HLS listeners - simplified with proper retries
  useEffect(() => {
    if (!currentVideo?.url || !playerRef.current) return;
    
    // Clear any existing listeners
    if (hlsRef.current) {
      hlsRef.current.off(Hls.Events.MANIFEST_PARSED);
      hlsRef.current.off(Hls.Events.LEVEL_SWITCHED);
    }
    
    const checkForHlsPlayer = () => {
      console.log('Checking for HLS player, attempt #', retryCountRef.current + 1);
      
      const internalPlayer = playerRef.current?.getInternalPlayer('hls');
      
      if (internalPlayer) {
        console.log('HLS player found, setting up listeners');
        hlsRef.current = internalPlayer as Hls;
        
        // Setup quality levels detection
        hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = hlsRef.current?.levels || [];
          if (levels.length > 0 && onQualityLevelsChange) {
            const formattedLevels = levels.map((level, index) => ({
              value: index,
              label: `${level.height}p${level.name ? ` (${level.name})` : ''}`,
            }));
            
            // Add auto option
            formattedLevels.unshift({ value: -1, label: 'Auto' });
            
            console.log('Quality levels found:', formattedLevels);
            onQualityLevelsChange(formattedLevels);
          }
        });
        
        // Track quality changes
        hlsRef.current.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          if (onCurrentQualityChange) {
            onCurrentQualityChange(data.level);
          }
        });
        
        // Also force check levels right now
        if (hlsRef.current.levels?.length > 0 && onQualityLevelsChange) {
          const formattedLevels = hlsRef.current.levels.map((level, index) => ({
            value: index,
            label: `${level.height}p${level.name ? ` (${level.name})` : ''}`,
          }));
          
          formattedLevels.unshift({ value: -1, label: 'Auto' });
          console.log('Immediate quality levels:', formattedLevels);
          onQualityLevelsChange(formattedLevels);
        }
        
        return true;
      }
      
      return false;
    };
    
    // Try immediately
    if (!checkForHlsPlayer()) {
      // If not successful, set up retry mechanism with increasing delays
      const retryInterval = setInterval(() => {
        retryCountRef.current += 1;
        
        if (checkForHlsPlayer() || retryCountRef.current >= 5) {
          clearInterval(retryInterval);
        }
      }, 1000); // Check every second up to 5 times
      
      return () => {
        clearInterval(retryInterval);
      };
    }
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.off(Hls.Events.MANIFEST_PARSED);
        hlsRef.current.off(Hls.Events.LEVEL_SWITCHED);
      }
    };
  }, [currentVideo?.url, playerRef.current]);

  // Function to set quality level - simplified and more robust
  const setQualityLevel = (level: number) => {
    console.log('Setting quality level to:', level);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    }
  };

  // Expose the setQualityLevel function to parent component
  useEffect(() => {
    if (playerRef.current) {
      (playerRef.current as any).setQualityLevel = setQualityLevel;
    }
  }, [playerRef.current]);


  const onReady = () => {
    console.log('Player ready, Init HLS Quality Control');
    const internalPlayer = playerRef.current?.getInternalPlayer('hls');
    if (!internalPlayer) {
      console.error('HLS player not found');
      return;
    }
  };

  return (
    <div className="w-full h-full">
      <ReactPlayer
        ref={playerRef}
        url={currentVideo?.url}
        width="100%"
        height="100%"
        playing={isPlaying}
        volume={isMuted ? 0 : volume / 100}
        muted={isMuted}
        onPlay={onPlay}
        onPause={onPause}
        onProgress={onProgress}
        onDuration={onDuration}
        onReady={onReady}
        config={{
          file: {
            forceHLS: true,
            hlsOptions: {
              enableWorker: true,
              autoStartLoad: true,
            },
            attributes: {
              style: { width: '100%', height: '100%', objectFit: 'contain' },
            },
          },
        }}
      />
    </div>
  );
};

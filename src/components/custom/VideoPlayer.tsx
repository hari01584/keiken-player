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

  // Setup HLS event listeners when the player mounts
  useEffect(() => {
    if (!playerRef.current) return;
    
    // We need to wait a bit for the player to initialize
    const timer = setTimeout(() => {
      if (!playerRef.current) return;
      console.log('Setting up HLS listeners');
      const internalPlayer = playerRef.current.getInternalPlayer('hls')

      hlsRef.current = internalPlayer as Hls;
      // Get quality levels
      hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hlsRef.current?.levels || [];
        if (levels.length > 0 && onQualityLevelsChange) {
          const formattedLevels = levels.map((level, index) => ({
            value: index,
            label: `${level.height}p${level.name ? ` (${level.name})` : ''}`,
          }));
          
          // Add auto option
          formattedLevels.unshift({ value: -1, label: 'Auto' });
          
          onQualityLevelsChange(formattedLevels);
        }
      });
      
      // Track current quality changes
      hlsRef.current.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (onCurrentQualityChange) {
          onCurrentQualityChange(data.level);
        }
      });
    }, 1000); // Give player time to initialize
    
    return () => {
      clearTimeout(timer);
      // Clean up listeners when component unmounts
      if (hlsRef.current) {
        hlsRef.current.off(Hls.Events.MANIFEST_PARSED);
        hlsRef.current.off(Hls.Events.LEVEL_SWITCHED);
      }
    };
  }, [playerRef.current, currentVideo]);

  // Function to set quality level
  const setQualityLevel = (level: number) => {
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

  return (
    <div className="w-full h-full">
      {currentVideo?.url && (
        <ReactPlayer
          ref={playerRef}
          url={currentVideo.url}
          width="100%"
          height="100%"
          playing={isPlaying}
          volume={isMuted ? 0 : volume / 100}
          muted={isMuted}
          onPlay={onPlay}
          onPause={onPause}
          onProgress={onProgress}
          onDuration={onDuration}
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
      )}
    </div>
  );
};

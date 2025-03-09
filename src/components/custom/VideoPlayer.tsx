import { Video } from '@/types';
import React, { useRef } from 'react';
import ReactPlayer from 'react-player/lazy';

interface VideoPlayerProps {
  currentVideo: Video | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onProgress: (progress: any) => void;
  onDuration: (duration: number) => void;
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
}) => {
  const playerRef = useRef<ReactPlayer | null>(null);

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

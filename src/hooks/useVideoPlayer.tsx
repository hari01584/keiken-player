import { Video } from '@/types';
import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';

export const useVideoPlayer = (isHost: boolean, hostTime: number) => {
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const playerRef = useRef<ReactPlayer | null>(null);
  
  // Add quality related state
  const [qualityLevels, setQualityLevels] = useState<{ value: number; label: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // Default to auto (-1)

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(value[0], 'seconds');
    setCurrentTime(value[0]);
  };
  
  // Add quality related functions
  const handleQualityChange = (quality: number) => {
    if (playerRef.current && (playerRef.current as any).setQualityLevel) {
      (playerRef.current as any).setQualityLevel(quality);
      setCurrentQuality(quality);
    }
  };

  return {
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playerRef,
    qualityLevels,
    currentQuality,
    setCurrentVideo,
    setPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    handlePlayPause,
    handleVolumeToggle,
    handleSeek,
    setQualityLevels,
    setCurrentQuality,
    handleQualityChange
  };
};

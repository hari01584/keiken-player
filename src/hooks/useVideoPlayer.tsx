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
  const [isSeekingLocally, setIsSeekingLocally] = useState(false);
  const playerRef = useRef<ReactPlayer | null>(null);
  
  // Add quality related state
  const [qualityLevels, setQualityLevels] = useState<{ value: number; label: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // Default to auto (-1)

  // Modified sync behavior - don't auto-sync non-hosts unless they're way off
  useEffect(() => {
    if (!isHost && playerRef.current) {
      const diff = Math.abs(hostTime - currentTime);
      // Only auto-sync if very far out of sync and not seeking locally
      if (diff > 10 && !isSeekingLocally) {
        playerRef.current.seekTo(hostTime, 'seconds');
        setCurrentTime(hostTime);
      }
    }
  }, [hostTime, isHost]);

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    if (!playerRef.current) return;
    setIsSeekingLocally(true);
    playerRef.current.seekTo(value[0], 'seconds');
    setCurrentTime(value[0]);
    setTimeout(() => {
      setIsSeekingLocally(false);
    }, 1000);
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

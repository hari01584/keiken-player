import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';

export const useVideoPlayer = (isHost: boolean, hostTime: number) => {
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

  useEffect(() => {
    if (!isHost && playerRef.current) {
      const diff = Math.abs(hostTime - currentTime);
      if (diff > 2 && !isSeekingLocally) {
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
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playerRef,
    setPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    handlePlayPause,
    handleVolumeToggle,
    handleSeek,
    // Quality related state and functions
    qualityLevels,
    currentQuality,
    setQualityLevels,
    setCurrentQuality,
    handleQualityChange
  };
};

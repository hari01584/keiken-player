import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onPlayPause: () => void;
  onVolumeToggle: () => void;
  onSeek: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onPlayPause,
  onVolumeToggle,
  onSeek,
  onVolumeChange,
}) => {
  return (
    <div className="flex flex-col gap-2 text-white">
      <Slider
        min={0}
        max={duration || 100}
        step={0.1}
        value={[currentTime]}
        onValueChange={onSeek}
        className="w-full"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onPlayPause} className="text-white hover:bg-white/20">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
          <span className="text-sm">{`${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60)
            .toString()
            .padStart(2, '0')} / ${Math.floor(duration / 60)}:${Math.floor(duration % 60)
            .toString()
            .padStart(2, '0')}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onVolumeToggle} className="text-white hover:bg-white/20">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </Button>
          <Slider min={0} max={100} value={[isMuted ? 0 : volume]} onValueChange={onVolumeChange} className="w-20" />
        </div>
      </div>
    </div>
  );
};

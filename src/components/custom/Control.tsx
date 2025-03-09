import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, RefreshCw, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isHost: boolean;
  isSynced: boolean;
  onPlayPause: () => void;
  onVolumeToggle: () => void;
  onSeek: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
  onSyncWithHost: () => void;
  onForceSyncAll: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isHost,
  isSynced,
  onPlayPause,
  onVolumeToggle,
  onSeek,
  onVolumeChange,
  onSyncWithHost,
  onForceSyncAll,
}) => {
  return (
    <div className="flex flex-col gap-2 text-white p-3 bg-zinc-900/80">
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
          {!isHost && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onSyncWithHost} 
                    className={`text-white hover:bg-white/20 ${isSynced ? 'text-green-400' : ''}`}
                  >
                    <RefreshCw size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sync with host</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isHost && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onForceSyncAll} 
                    className="text-white hover:bg-white/20"
                  >
                    <Users size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Force sync all users</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button variant="ghost" size="icon" onClick={onVolumeToggle} className="text-white hover:bg-white/20">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </Button>
          <Slider min={0} max={100} value={[isMuted ? 0 : volume]} onValueChange={onVolumeChange} className="w-20" />
        </div>
      </div>
    </div>
  );
};

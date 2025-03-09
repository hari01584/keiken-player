import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Video } from '@/types';

interface PlaylistProps {
  playlist: Video[];
  currentVideoId: string | null;
  isHost: boolean;
  onVideoSelect: (video: Video) => void;
  onDeleteVideo: (videoId: string) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
  playlist,
  currentVideoId,
  isHost,
  onVideoSelect,
  onDeleteVideo,
}) => {
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-md h-[400px] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-3 text-white">Playlist</h2>
      {playlist.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-zinc-500">
          No videos in playlist
        </div>
      ) : (
        <div className="space-y-2">
          {playlist.map((video) => (
            <div
              key={video.id}
              onClick={() => onVideoSelect(video)}
              className={`p-2 rounded-md cursor-pointer hover:bg-zinc-800 ${
                currentVideoId === video.id ? 'bg-zinc-800' : 'bg-zinc-850'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-medium truncate text-white">{video.title}</h3>
                </div>
                {isHost && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteVideo(video.id);
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
              {currentVideoId === video.id && (
                <div className="flex items-center">
                  <div className="w-2 h-2 mr-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-blue-400">Now playing</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

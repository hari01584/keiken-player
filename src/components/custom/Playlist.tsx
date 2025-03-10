import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';

interface PlaylistProps {
  playlist: Video[];
  currentHostVideoId: string | null;
  isHost: boolean;
  onVideoSelect: (video: Video) => void;
  onDeleteVideo: (videoId: string) => void;
  onAddVideo: (video: Video) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
  playlist,
  currentHostVideoId,
  isHost,
  onVideoSelect,
  onDeleteVideo,
  onAddVideo,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [addVideoError, setAddVideoError] = useState<string | null>(null);

  const handleAddVideo = async () => {
    if (!newVideoUrl) return;
    
    setIsAddingVideo(true);
    setAddVideoError(null);
    
    try {
      // Call HLS API to get proxied URL
      const response = await fetch(`/api/hls?url=${encodeURIComponent(newVideoUrl)}`);
      
      if (!response.ok) {
        throw new Error('Failed to proxy video URL');
      }
      
      const data = await response.json();
      
      // Add video with proxied URL
      onAddVideo({
        id: nanoid(),
        url: data.proxiedUrl,
        title: newVideoTitle || `Video ${playlist.length + 1}`,
        duration: '0:00', // default duration
      });
      
      setNewVideoUrl('');
      setNewVideoTitle('');
      setShowAddForm(false);
    } catch (error) {
      setAddVideoError(error instanceof Error ? error.message : 'Error adding video');
      console.error('Error adding video:', error);
    } finally {
      setIsAddingVideo(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-zinc-900 border-l border-zinc-700 transition-all duration-300",
        "absolute top-0 bottom-0",
        collapsed ? "right-0 w-12" : "right-0 w-80"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute z-10 top-4 left-2 text-white hover:bg-white/20"
      >
        {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </Button>
      
      {collapsed ? (
        <div 
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
          onClick={() => setCollapsed(false)}
        >
          <div className="rotate-90 transform origin-center whitespace-nowrap text-white">
            Playlist ({playlist.length})
          </div>
        </div>
      ) : (
        <div className="p-4 w-full h-full flex flex-col overflow-hidden">
          <div className="flex items-center mb-3 pl-6">
            <h2 className="text-lg font-semibold text-white flex-1 truncate mr-2">Playlist ({playlist.length})</h2>
            {isHost && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-white hover:bg-white/20 flex-shrink-0"
              >
                <Plus size={16} />
              </Button>
            )}
          </div>
          
          {isHost && showAddForm && (
            <div className="mb-4 space-y-2 p-2 bg-zinc-800 rounded-md">
              <Input
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="Title (optional)"
                className="bg-zinc-700 border-zinc-600 text-white"
                disabled={isAddingVideo}
              />
              <Input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="Video URL"
                className="bg-zinc-700 border-zinc-600 text-white"
                disabled={isAddingVideo}
              />
              {addVideoError && (
                <p className="text-xs text-red-400 mt-1">{addVideoError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  disabled={isAddingVideo}
                  className="border-zinc-600"
                >
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleAddVideo}
                  disabled={isAddingVideo}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAddingVideo ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto">
            {playlist.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-500">
                No videos in playlist
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => onVideoSelect(video)}
                    className={`p-2 rounded-md cursor-pointer hover:bg-zinc-800 ${
                      currentHostVideoId === video.id ? 'bg-zinc-800' : 'bg-zinc-850'
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
                    {currentHostVideoId === video.id && (
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
        </div>
      )}
    </div>
  );
};

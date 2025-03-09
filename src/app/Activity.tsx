import { Button } from '@/components/ui/button'
import { useDiscordSdk } from '../hooks/useDiscordSdk'
import { useSyncState } from '@robojs/sync'
import { useEffect, useRef, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Volume2, VolumeX, Play, Pause, ChevronUp, ChevronDown, 
         ChevronRight, ChevronLeft, UserCog, Clock, Users, Settings,
         Plus, X, ExternalLink, Trash2 } from 'lucide-react'
import Hls from 'hls.js'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from "sonner"
import { useCallback } from 'react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Events, Types } from '@discord/embedded-app-sdk'

interface Video {
  id: string;
  title: string;
  duration: string;
  url: string;
  referral?: string;
  addedBy?: string;
}

export const Activity = () => {
  const { accessToken, authenticated, discordSdk, error, session, status } = useDiscordSdk()
  const currentUserId = session?.user.username
  const channelId = discordSdk.channelId;

  // Sync states across all users in the channel
  const [hostId, setHostId] = useSyncState<string | null>(null, ['host', channelId]);
  const [isPlaying, setPlaying] = useSyncState(false, ['video', 'playing', channelId]);
  const [currentVideoId, setCurrentVideoId] = useSyncState<string | null>(null, ['video', 'current', channelId]);
  const [hostTime, setHostTime] = useSyncState(0, ['video', 'time', channelId]);
  const [playlist, setPlaylist] = useSyncState<Video[]>([], ['playlist', channelId]);
  // const [activeParticipants, setActiveParticipants] = useSyncState<string[]>([], ['participants', channelId]);

  // Local states
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaylistVisible, setPlaylistVisible] = useState(true);
  const [syncPlayback, setSyncPlayback] = useState(true);
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoReferral, setNewVideoReferral] = useState('');
  const [isBottomBarPinned, setIsBottomBarPinned] = useState(false);
  const [isSeekingLocally, setIsSeekingLocally] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timeSyncInterval = useRef<NodeJS.Timeout | null>(null);
  const proxiedUrlCache = useRef<Map<string, string>>(new Map());
  
  const isHost = currentUserId === hostId;
  const currentVideo = playlist.find(video => video.id === currentVideoId) || null;

  const loadProxiedStream = (url: string) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    if (Hls.isSupported()) {
      hlsRef.current = new Hls();
      hlsRef.current.loadSource(url);
      if (videoRef.current) {
        hlsRef.current.attachMedia(videoRef.current);
      }
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = url;
    }
  };

  // Determine host when first user joins
  useEffect(() => {
    if (!currentUserId) return;
    console.log('First host set check', currentUserId, hostId);
    if (!hostId && currentUserId) {
      // First user becomes the host
      setHostId(currentUserId);
    }
  }, [currentUserId, hostId]);

  useEffect(() => {
    if (currentVideoId && playlist.length > 0) {
      const selected = playlist.find(video => video.id === currentVideoId);
      if (selected && selected.url) {
        loadProxiedStream(selected.url);
      }
    }
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentVideoId, playlist]);

  const handlePlayPause = () => {
    if (isHost || !syncPlayback) {
      setPlaying(!isPlaying);
    } else {
      toast.info("Playback is synced with host", {
        description: "Disable sync to control playback individually"
      });
    }
  };
  
  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };
  
  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    
    if (isHost || !syncPlayback) {
      setIsSeekingLocally(true);
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
      
      if (isHost) {
        // Update host time after seeking
        setHostTime(value[0]);
      }
      
      // Reset seeking flag after a short delay
      setTimeout(() => {
        setIsSeekingLocally(false);
      }, 1000);
    } else {
      toast.info("Playback is synced with host", {
        description: "Disable sync to control playback individually"
      });
    }
  };

// Add a function to force-sync other participants
const handleForceSyncAll = useCallback(() => {
  if (!videoRef.current) return;
  // Only host updates hostTime, forcing all synced clients to jump
  if (isHost) {
    setHostTime(videoRef.current.currentTime);
    toast.info("All viewers have been synced to your current time");
  }
}, [isHost, setHostTime]);

const handleDeleteVideo = (videoId: string) => {
  if (!isHost) {
    toast.error("Only the host can delete videos");
    return;
  }
  setPlaylist((prev) => prev.filter((v) => v.id !== videoId));
};

  const addVideoToPlaylist = async () => {
    if (!newVideoUrl) {
      toast.error("URL is required", {
        description: "Please enter a valid HLS stream URL",
      });
      return;
    }
    
    // Basic URL validation
    if (!newVideoUrl.includes('m3u8')) {
      toast.warning("URL Warning", {
        description: "URL doesn't appear to be an HLS stream (.m3u8)",
      });
    }

    // Fetch the proxied URL from /api/hls
    try {
      const response = await fetch(`/api/hls?url=${encodeURIComponent(newVideoUrl)}`);
      const data = await response.json();
      console.log("Data from /api/hls", data);
      const newItem: Video = {
        id: Date.now().toString(),
        title: newVideoTitle || 'Untitled',
        url: data.proxiedUrl,
        duration: 'Unknown',
        referral: newVideoReferral,
        addedBy: currentUserId,
      };
      // Only host updates the synced playlist
      if (isHost) {
        setPlaylist((prev) => [...prev, newItem]);
        toast.success("Video added to playlist");
      } else {
        toast.error("Only the host can add videos");
      }
    } catch (error) {
      toast.error("Failed to reach /api/hls");
    }
  };
  
  const handleVideoSelect = (video: Video) => {
    if (isHost || !syncPlayback) {
      setCurrentVideoId(video.id);
      setPlaying(true);
    } else {
      toast.info("Video selection is synced with host", {
        description: "Disable sync to select videos individually"
      });
    }
  };
  
  const toggleSyncPlayback = (value: boolean) => {
    setSyncPlayback(value);
    
    if (value && videoRef.current) {
      // When enabling sync, immediately sync with host time
      videoRef.current.currentTime = hostTime;
    }
    
    toast.info(value ? "Playback synced with host" : "Individual playback enabled");
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (currentUserId === undefined) {
    // ie we waiting for user authentication, show a loading spinner
    return <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center justify-center">
        <LoadingSpinner/>
        <div className="text-white text-lg mb-4 mt-4">Please authenticate to continue...</div>
      </div>
    </div>
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black">
      <p className="text-white p-4">Watch Party by {hostId}</p>
      {/* Main video container */}
      <div className="relative flex-1 h-full md:h-full overflow-hidden bg-black flex flex-col"
           onMouseEnter={() => !isBottomBarPinned && setControlsVisible(true)}
           onMouseLeave={() => !isBottomBarPinned && setControlsVisible(false)}>
        
        {/* Video element */}
        <video 
          ref={videoRef}
          className="w-full h-full object-contain"
          onClick={handlePlayPause}
        />
        
        {!currentVideo && (
          <div className="absolute inset-0 flex items-center justify-center flex-col text-white/70">
            <div className="bg-black/50 p-6 rounded-lg text-center">
              <h2 className="text-xl font-medium mb-4">No video selected</h2>
              <p className="mb-4">Add a video to the playlist to start watching</p>
              <Button 
                variant="outline" 
                onClick={() => setShowAddVideoDialog(true)}
              >
                <Plus size={16} className="mr-2" /> Add Video
              </Button>
            </div>
          </div>
        )}
        
        {isHost && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="bg-blue-600 hover:bg-blue-700">
              Host
            </Badge>
          </div>
        )}
        
        {!isHost && syncPlayback && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="outline" className="border-blue-500 text-blue-400">
              <Clock size={12} className="mr-1" /> Synced
            </Badge>
          </div>
        )}
        
        {/* Toggle playlist button (visible on mobile) */}
        <div className="absolute top-2 right-2 md:hidden z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setPlaylistVisible(!isPlaylistVisible)}
            className="text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10"
          >
            {isPlaylistVisible ? <ChevronRight size={28} /> : <ChevronLeft size={28} />}
          </Button>
        </div>
        
        {/* Mobile-friendly bottom controls indicator */}
        <div className={`absolute bottom-0 left-0 right-0 flex justify-center ${controlsVisible ? 'hidden' : 'block'}`}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setControlsVisible(true)}
            className="bg-black/30 text-white hover:bg-black/50 rounded-t-md rounded-b-none px-2 py-1 h-6"
          >
            <ChevronUp size={16} />
          </Button>
        </div>

        {/* Controls overlay - shows on hover or when explicitly visible */}
        <div className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent p-4 ${controlsVisible ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex flex-col gap-2 text-white">
            {/* Progress bar */}
            <Slider 
              min={0} 
              max={duration || 100} 
              step={0.1} 
              value={[currentTime]} 
              onValueChange={handleSeek} 
              className="w-full" 
              disabled={!(isHost || !syncPlayback)}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Play/Pause button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                  disabled={!(isHost || !syncPlayback)}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </Button>
                
                {/* Time display */}
                <span className="text-sm hidden sm:inline">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <span className="text-sm sm:hidden">
                  {formatTime(currentTime)}
                </span>
              </div>
              
              {/* Volume control */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleVolumeToggle}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </Button>
                <Slider 
                  min={0} 
                  max={100} 
                  value={[isMuted ? 0 : volume]} 
                  onValueChange={(val) => setVolume(val[0])} 
                  className="w-20 hidden sm:block" 
                />
                
                {/* Toggle playlist button (visible on desktop) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPlaylistVisible(!isPlaylistVisible)}
                  className="text-white hover:bg-white/20 hidden md:flex w-10 h-10"
                >
                  {isPlaylistVisible ? <ChevronRight size={28} /> : <ChevronLeft size={28} />}
                </Button>
                
                {/* Pin/unpin bottom bar */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsBottomBarPinned(!isBottomBarPinned)}
                  className={`text-white hover:bg-white/20 ${isBottomBarPinned ? 'bg-white/20' : ''}`}
                >
                  {isBottomBarPinned ? <X size={16} /> : <ChevronUp size={16} />}
                </Button>
                
                {/* Toggle controls visibility button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setControlsVisible(!controlsVisible)}
                  className="text-white hover:bg-white/20"
                >
                  {controlsVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Playlist sidebar - collapsible */}
      <div 
        className={`${isPlaylistVisible ? 'w-full md:w-64' : 'w-0'} h-full bg-zinc-900 text-white overflow-hidden transition-all duration-300`}
        style={{ minHeight: isPlaylistVisible ? '16rem' : '0' }}
      >
        {/* Collapsed sidebar indicator on desktop */}
        {!isPlaylistVisible && (
          <div className="hidden md:flex h-full items-center">
            <div 
              onClick={() => setPlaylistVisible(true)}
              className="bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer h-full flex items-center px-2 transition-colors"
            >
              <ChevronLeft size={36} />
            </div>
          </div>
        )}
        
        <div className={`${isPlaylistVisible ? 'block' : 'hidden'} h-full`}>
          <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-medium">Up Next</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddVideoDialog(true)}
                className="text-white hover:bg-white/20"
                title="Add Video"
              >
                <Plus size={18} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPlaylistVisible(false)}
                className="md:hidden text-white hover:bg-white/20 w-10 h-10"
              >
                <ChevronRight size={28} />
              </Button>
            </div>
          </div>
          
          {/* Host controls section */}
          {isHost && (
            <div className="border-b border-zinc-800 p-3">
              <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                <UserCog size={16} />
                Host Controls
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>Sync Playback</span>
                  </div>
                  <Switch
                    checked={syncPlayback}
                    onCheckedChange={setSyncPlayback}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span>Viewers: 5</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Settings size={12} className="mr-1" /> Manage
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm">Force Sync Everyone</span>
                  <Button variant="outline" size="sm" onClick={handleForceSyncAll}>
                    Sync Now
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Non-host sync indicator */}
          {!isHost && syncPlayback && (
            <div className="border-b border-zinc-800 p-3">
              <div className="flex items-center gap-2 text-sm bg-blue-900/30 p-2 rounded">
                <Clock size={14} className="text-blue-400" />
                <span>Playback controlled by {hostId}</span>
              </div>
            </div>
          )}
          
          <ScrollArea className="h-[calc(100%-48px-1px)] md:h-[calc(100%-48px-1px)]">
            <div className="p-2 space-y-2">
              {playlist.map(video => (
                <div 
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className={`p-2 rounded-md cursor-pointer hover:bg-zinc-800 ${currentVideo && currentVideo.id === video.id ? 'bg-zinc-800' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium truncate">{video.title}</h3>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400 ml-2">
                      {/* {video.duration} */}
                      {isHost && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-white hover:bg-white/20"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                    </div>
                  </div>
                  {currentVideo && currentVideo.id === video.id && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 mr-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-blue-400">Now playing</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* Add Video Dialog */}
      <Dialog open={showAddVideoDialog} onOpenChange={setShowAddVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video to Playlist</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="video-title">Title (optional)</Label>
              <Input 
                id="video-title"
                placeholder="Enter video title"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="video-url">
                <span className="flex items-center gap-1">
                  HLS Video URL <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input 
                id="video-url"
                placeholder="https://example.com/video.m3u8"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                required
              />
              <p className="text-xs text-zinc-400">
                Enter a valid HLS stream URL (.m3u8 format)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="video-referral" className="flex items-center gap-1">
                Referral Link <ExternalLink size={12} /> (optional)
              </Label>
              <Input 
                id="video-referral"
                placeholder="https://example.com"
                value={newVideoReferral}
                onChange={(e) => setNewVideoReferral(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddVideoDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addVideoToPlaylist}>
                Add to Playlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

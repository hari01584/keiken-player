import React, { useEffect, useState } from 'react';
import { useDiscordSdk } from '../hooks/useDiscordSdk';
import { useSyncState } from '@robojs/sync';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { VideoPlayer } from '@/components/custom/VideoPlayer';
import { Controls } from '@/components/custom/Control';
import { Playlist } from '@/components/custom/Playlist';
import { Video } from '@/types';
import { toast } from 'sonner';

export const Activity = () => {
  const { accessToken, authenticated, discordSdk, error, session, status } = useDiscordSdk();
  const currentUserId = session?.user.username;
  const channelId = discordSdk.channelId;

  const [hostId, setHostId] = useSyncState<string | null>(null, ['host', channelId]);
  const [currentVideoId, setCurrentVideoId] = useSyncState<string | null>(null, ['video', 'current', channelId]);
  const [hostTime, setHostTime] = useSyncState(0, ['video', 'time', channelId]);
  const [forceSyncFlag, setForceSyncFlag] = useSyncState(0, ['video', 'force-sync', channelId]);
  const [playlist, setPlaylist] = useSyncState<Video[]>([], ['playlist', channelId]);
  
  const [isSynced, setIsSynced] = useState(true);
  const isHost = currentUserId === hostId;

  const {
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
  } = useVideoPlayer(isHost, hostTime);

  const currentVideo = playlist.find((video) => video.id === currentVideoId) || null;

  useEffect(() => {
    if (!currentUserId) return;
    if (!hostId && currentUserId) {
      setHostId(currentUserId);
    }
  }, [currentUserId, hostId]);
  
  // Handle force sync from host
  useEffect(() => {
    if (!isHost && forceSyncFlag > 0) {
      handleSyncWithHost();
      toast.success("Synced with host. Your playback has been synchronized with the host.");
    }
  }, [forceSyncFlag]);

  const handleSyncWithHost = () => {
    if (playerRef.current && Math.abs(currentTime - hostTime) > 2) {
      playerRef.current.seekTo(hostTime, 'seconds');
      setIsSynced(true);
      toast.message("Synced with host", {
        description: "Your playback has been synchronized with the host.",
      });
    }
  };

  const handleForceSyncAll = () => {
    if (isHost) {
      setForceSyncFlag(prev => prev + 1);
      toast.message("Force sync initiated", {
        description: "All viewers will sync to your current position.",
      });
    }
  };

  // When the host time changes, check if client is out of sync
  useEffect(() => {
    if (!isHost && Math.abs(currentTime - hostTime) > 5) {
      setIsSynced(false);
    }
  }, [hostTime, currentTime, isHost]);

  const handleAddVideo = (video: Video) => {
    setPlaylist([...playlist, video]);
    
    // If this is the first video, also set it as current
    if (playlist.length === 0) {
      setCurrentVideoId(video.id);
    }
    
    toast.message("Video added", {
      description: `"${video.title}" has been added to the playlist.`,
    });
  };

  return (
    <div className="flex flex-row h-screen bg-black">
      <div className="relative flex-1 h-full overflow-hidden bg-black flex flex-col">
        <div className="absolute top-4 left-4 z-10 bg-black/60 px-3 py-1 rounded-md text-white text-sm">
          {hostId ? `Host: ${hostId}` : 'No host assigned'}
          {isHost && ' (You)'}
        </div>
        
        <div className="flex-1 relative">
          <VideoPlayer
            currentVideo={currentVideo}
            isPlaying={isPlaying}
            volume={volume}
            isMuted={isMuted}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onProgress={(progress) => {
              setCurrentTime(progress.playedSeconds);
              if (isHost) {
                setHostTime(progress.playedSeconds);
              }
            }}
            onDuration={setDuration}
            playerRef={playerRef}
          />
        </div>
        
        <Controls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isHost={isHost}
          isSynced={isSynced}
          onPlayPause={handlePlayPause}
          onVolumeToggle={handleVolumeToggle}
          onSeek={handleSeek}
          onVolumeChange={(val) => setVolume(val[0])}
          onSyncWithHost={handleSyncWithHost}
          onForceSyncAll={handleForceSyncAll}
        />
      </div>
      
      <Playlist
        playlist={playlist}
        currentVideoId={currentVideoId}
        isHost={isHost}
        onVideoSelect={(video) => setCurrentVideoId(video.id)}
        onDeleteVideo={(videoId) => {
          const isCurrentVideo = currentVideoId === videoId;
          const newPlaylist = playlist.filter(v => v.id !== videoId);
          setPlaylist(newPlaylist);
          
          // If we deleted the current video, switch to the first video in playlist or null
          if (isCurrentVideo) {
            setCurrentVideoId(newPlaylist.length > 0 ? newPlaylist[0].id : null);
          }
        }}
        onAddVideo={handleAddVideo}
      />
    </div>
  );
};

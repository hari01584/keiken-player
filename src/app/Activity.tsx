import React, { useEffect } from 'react';
import { useDiscordSdk } from '../hooks/useDiscordSdk';
import { useSyncState } from '@robojs/sync';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { VideoPlayer } from '@/components/custom/VideoPlayer';
import { Controls } from '@/components/custom/Control';
import { Playlist } from '@/components/custom/Playlist';
import { Video } from '@/types';

export const Activity = () => {
  const { accessToken, authenticated, discordSdk, error, session, status } = useDiscordSdk();
  const currentUserId = session?.user.username;
  const channelId = discordSdk.channelId;

  const [hostId, setHostId] = useSyncState<string | null>(null, ['host', channelId]);
  const [currentVideoId, setCurrentVideoId] = useSyncState<string | null>(null, ['video', 'current', channelId]);
  const [hostTime, setHostTime] = useSyncState(0, ['video', 'time', channelId]);
  const [playlist, setPlaylist] = useSyncState<Video[]>([], ['playlist', channelId]);

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
  } = useVideoPlayer(currentUserId === hostId, hostTime);

  const currentVideo = playlist.find((video) => video.id === currentVideoId) || null;

  useEffect(() => {
    if (!currentUserId) return;
    if (!hostId && currentUserId) {
      setHostId(currentUserId);
    }
  }, [currentUserId, hostId]);

  return (
    <div className="flex flex-row h-screen bg-black">
      <p className="text-white p-4">Watch Party by {hostId}</p>
      <div className="relative flex-1 h-full overflow-hidden bg-black flex flex-col">
        <VideoPlayer
          currentVideo={currentVideo}
          isPlaying={isPlaying}
          volume={volume}
          isMuted={isMuted}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onProgress={(progress) => {
            setCurrentTime(progress.playedSeconds);
            if (currentUserId === hostId) {
              setHostTime(progress.playedSeconds);
            }
          }}
          onDuration={setDuration}
        />
        <Controls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          onPlayPause={handlePlayPause}
          onVolumeToggle={handleVolumeToggle}
          onSeek={handleSeek}
          onVolumeChange={(val) => setVolume(val[0])}
        />
      </div>
      <Playlist
        playlist={playlist}
        currentVideoId={currentVideoId}
        isHost={currentUserId === hostId}
        onVideoSelect={(video) => setCurrentVideoId(video.id)}
        onDeleteVideo={(videoId) => setPlaylist((prev) => prev.filter((v) => v.id !== videoId))}
      />
    </div>
  );
};

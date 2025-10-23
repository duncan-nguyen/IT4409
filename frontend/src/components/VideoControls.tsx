import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Button } from './ui/button';

interface VideoControlsProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
}

export default function VideoControls({
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
}: VideoControlsProps) {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 bg-card/95 backdrop-blur-sm px-6 py-4 rounded-full shadow-2xl border border-border">
      <Button
        onClick={onToggleAudio}
        size="icon"
        variant={isAudioEnabled ? "default" : "destructive"}
        className="h-14 w-14 rounded-full transition-all hover:scale-110"
        title={isAudioEnabled ? 'Mute' : 'Unmute'}
      >
        {isAudioEnabled ? (
          <Mic className="h-6 w-6" />
        ) : (
          <MicOff className="h-6 w-6" />
        )}
      </Button>
      
      <Button
        onClick={onToggleVideo}
        size="icon"
        variant={isVideoEnabled ? "default" : "destructive"}
        className="h-14 w-14 rounded-full transition-all hover:scale-110"
        title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
      >
        {isVideoEnabled ? (
          <Video className="h-6 w-6" />
        ) : (
          <VideoOff className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}

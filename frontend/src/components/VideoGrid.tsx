import { FilterType, Peer } from '@/types';
import { MicOff, VideoOff, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface VideoGridProps {
  localStream: MediaStream | null;
  peers: Peer[];
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isVideoEnabled: boolean;
  isAudioEnabled?: boolean;
  isScreenSharing?: boolean;
  currentFilter?: FilterType;
  localUsername?: string;
  localRole?: 'host' | 'participant';
  onKick?: (peerId: string) => void;
  onMute?: (peerId: string) => void;
}

export default function VideoGrid({
  localStream,
  peers,
  canvasRef,
  isVideoEnabled,
  isAudioEnabled = true,
  isScreenSharing = false,
  currentFilter = 'none',
  localUsername,
  localRole,
  onKick,
  onMute
}: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream && isVideoEnabled) {
      localVideoRef.current.srcObject = localStream;
      console.log('📺 VideoGrid: Local stream assigned to video element');
    }
  }, [localStream, isVideoEnabled]);

  const totalVideos = 1 + peers.length;

  // Filters are now applied in processed canvas; no CSS filter here

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className={`grid gap-6 w-full max-w-7xl transition-all duration-500 ${totalVideos === 1 ? 'grid-cols-1' :
        totalVideos === 2 ? 'grid-cols-2' :
          totalVideos <= 4 ? 'grid-cols-2' :
            'grid-cols-3'
        }`}>
        {/* Local Video */}
        <div className={`relative group rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,243,255,0.2)] ${totalVideos === 1 ? 'aspect-video max-h-[80vh]' : 'aspect-video'
          }`}>
          {isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-cosmic-800/80 backdrop-blur-md">
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-neon-blue/20 blur-xl rounded-full"></div>
                  <VideoOff className="relative h-16 w-16 mx-auto mb-2 text-white/50" />
                </div>
                <p className="text-white/50 font-medium">Camera Off</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 glass-panel px-4 py-2 rounded-full flex items-center space-x-2 backdrop-blur-md bg-black/40 border-white/10">
            <span className="text-sm font-medium text-white shadow-black drop-shadow-md">{localUsername || 'You'}</span>
            {!isAudioEnabled && <MicOff className="h-4 w-4 text-red-400" />}
          </div>
        </div>

        {/* Remote Videos */}
        {peers.map((peer) => (
          <RemoteVideo
            key={peer.peerId}
            peer={peer}
            totalVideos={totalVideos}
            localRole={localRole}
            onKick={onKick}
            onMute={onMute}
          />
        ))}
      </div>
    </div>
  );
}

function RemoteVideo({
  peer,
  totalVideos,
  localRole,
  onKick,
  onMute
}: {
  peer: Peer;
  totalVideos: number;
  localRole?: 'host' | 'participant';
  onKick?: (peerId: string) => void;
  onMute?: (peerId: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className={`relative group rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(188,19,254,0.2)] ${totalVideos === 1 ? 'aspect-video max-h-[80vh]' : 'aspect-video'
      }`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover scale-x-[-1]"
      />
      <div className="absolute bottom-4 left-4 glass-panel px-4 py-2 rounded-full backdrop-blur-md bg-black/40 border-white/10">
        <span className="text-sm font-medium text-white shadow-black drop-shadow-md">{peer.username || `Peer ${peer.peerId.slice(0, 6)}`}</span>
      </div>

      {/* Moderation Controls */}
      {localRole === 'host' && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={() => onMute?.(peer.peerId)}
            className="glass-button p-2 rounded-full hover:bg-red-500/20 hover:border-red-500/50 text-white transition-all"
            title="Mute User"
          >
            <MicOff className="w-4 h-4" />
          </button>
          <button
            onClick={() => onKick?.(peer.peerId)}
            className="glass-button p-2 rounded-full hover:bg-red-500/20 hover:border-red-500/50 text-white transition-all"
            title="Kick User"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

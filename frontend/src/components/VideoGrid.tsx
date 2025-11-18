import { useEffect, useRef } from 'react';
import { Peer } from '@/types';
import { VideoOff } from 'lucide-react';

interface VideoGridProps {
  localStream: MediaStream | null;
  peers: Peer[];
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isVideoEnabled: boolean;
}

export default function VideoGrid({ localStream, peers, canvasRef, isVideoEnabled }: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && canvasRef.current) {
      const stream = canvasRef.current.captureStream(30);
      localVideoRef.current.srcObject = stream;
      console.log('📺 VideoGrid: Canvas stream assigned to video element');
      console.log('Canvas dimensions:', canvasRef.current.width, 'x', canvasRef.current.height);
    }
  }, [localStream, canvasRef]);

  const totalVideos = 1 + peers.length;
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className={`grid gap-4 w-[70%] max-w-5xl ${
        totalVideos === 1 ? 'grid-cols-1' :
        totalVideos === 2 ? 'grid-cols-2' :
        totalVideos <= 4 ? 'grid-cols-2' :
        'grid-cols-3'
      }`}>
        {/* Local Video */}
        <div className={`relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl ${
          totalVideos === 1 ? 'aspect-video max-h-full' : 'aspect-video'
        }`}>
          {isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <VideoOff className="h-16 w-16 mx-auto mb-2 text-gray-500" />
                <p className="text-gray-400">Camera Off</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-4 py-2 rounded-full">
            <span className="text-base font-medium">You</span>
          </div>
        </div>

        {/* Remote Videos */}
        {peers.map((peer) => (
          <RemoteVideo key={peer.peerId} peer={peer} totalVideos={totalVideos} />
        ))}
      </div>
    </div>
  );
}

function RemoteVideo({ peer, totalVideos }: { peer: Peer; totalVideos: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className={`relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl ${
      totalVideos === 1 ? 'aspect-video max-h-full' : 'aspect-video'
    }`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-4 py-2 rounded-full">
        <span className="text-base font-medium">Peer {peer.peerId.slice(0, 6)}</span>
      </div>
    </div>
  );
}

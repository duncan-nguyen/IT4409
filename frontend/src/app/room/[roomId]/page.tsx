'use client';

import ChatBox from '@/components/ChatBox';
import ReactionsOverlay from '@/components/ReactionsOverlay';
import UnifiedControlBar from '@/components/UnifiedControlBar';
import VideoGrid from '@/components/VideoGrid';
import { VirtualBackgroundType } from '@/components/VirtualBackgroundSelector';
import { Button } from '@/components/ui/button';
import { FilterType, Peer } from '@/types';
import { disconnectSocket, initSocket } from '@/utils/socket';
import { PeerConnection } from '@/utils/webrtc';
import { AIServiceConnection } from '@/utils/webrtc-ai';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId as string;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [currentFilter, setCurrentFilter] = useState<FilterType>('none');
  const [currentBackground, setCurrentBackground] = useState<VirtualBackgroundType>('none');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState('');
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const socketRef = useRef<ReturnType<typeof initSocket> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const aiConnectionRef = useRef<AIServiceConnection | null>(null);

  // Initialize camera
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        setLocalStream(stream);
        setProcessedStream(stream); // Default to raw stream
        localStreamRef.current = stream;
        setError('');

        // Initialize AI Service Connection
        aiConnectionRef.current = new AIServiceConnection();

      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Failed to access camera/microphone. Please check permissions.');
      }
    };

    initMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (aiConnectionRef.current) {
        aiConnectionRef.current.close();
      }
    };
  }, []);

  // AI Processing Pipeline
  useEffect(() => {
    const processVideo = async () => {
      if (!localStream || !aiConnectionRef.current) return;

      let mode: 'blur' | 'face-detection' | 'none' = 'none';

      if (currentBackground === 'blur') {
        mode = 'blur';
      } else if (currentFilter === 'face-detection') {
        mode = 'face-detection';
      }

      if (mode === 'none') {
        setProcessedStream(localStream);
        aiConnectionRef.current.close();
        return;
      }

      try {
        console.log('🔄 Switching to AI mode:', mode);
        const newStream = await aiConnectionRef.current.processStream(localStream, mode);

        // Add audio track from original stream
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }

        setProcessedStream(newStream);
      } catch (err) {
        console.error('Failed to process stream with AI service:', err);
        // Fallback to original stream
        setProcessedStream(localStream);
      }
    };

    processVideo();
  }, [localStream, currentFilter, currentBackground]);

  // Update Peer Connections when stream changes
  useEffect(() => {
    if (!processedStream) return;

    const videoTrack = processedStream.getVideoTracks()[0];
    if (!videoTrack) return;

    peerConnectionsRef.current.forEach((pc) => {
      const sender = pc.getPeerConnection().getSenders().find((s: RTCRtpSender) => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });
  }, [processedStream]);

  // WebRTC and signaling
  useEffect(() => {
    if (!processedStream || !roomId) return;

    // Only init socket once
    if (!socketRef.current) {
      const socket = initSocket();
      socketRef.current = socket;

      socket.emit('join_room', { roomId });

      socket.on('user_joined', async ({ peerId }) => {
        console.log('User joined:', peerId);
        const pc = new PeerConnection(peerId, (stream) => {
          setPeers((prev) => {
            const newPeers = new Map(prev);
            newPeers.set(peerId, { peerId, stream });
            return newPeers;
          });
        });

        if (processedStream) {
          pc.addStream(processedStream);
        }

        const offer = await pc.createOffer();
        socket.emit('offer', { roomId, peerId, offer });

        pc.onIceCandidate((candidate) => {
          socket.emit('ice_candidate', { roomId, peerId, candidate });
        });

        peerConnectionsRef.current.set(peerId, pc);
      });

      socket.on('offer', async ({ peerId, offer }) => {
        console.log('Received offer from:', peerId);
        const pc = new PeerConnection(peerId, (stream) => {
          setPeers((prev) => {
            const newPeers = new Map(prev);
            newPeers.set(peerId, { peerId, stream });
            return newPeers;
          });
        });

        if (processedStream) {
          pc.addStream(processedStream);
        }

        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        socket.emit('answer', { roomId, peerId, answer });

        pc.onIceCandidate((candidate) => {
          socket.emit('ice_candidate', { roomId, peerId, candidate });
        });

        peerConnectionsRef.current.set(peerId, pc);
      });

      socket.on('answer', async ({ peerId, answer }) => {
        const pc = peerConnectionsRef.current.get(peerId);
        if (pc) {
          await pc.setRemoteDescription(answer);
        }
      });

      socket.on('ice_candidate', async ({ peerId, candidate }) => {
        const pc = peerConnectionsRef.current.get(peerId);
        if (pc) {
          await pc.addIceCandidate(candidate);
        }
      });

      socket.on('user_left', ({ peerId }) => {
        const pc = peerConnectionsRef.current.get(peerId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(peerId);
        }
        setPeers((prev) => {
          const newPeers = new Map(prev);
          newPeers.delete(peerId);
          return newPeers;
        });
      });
    }

    return () => {
      // Don't close socket here to avoid reconnection loops on stream change
      // Cleanup is handled in a separate effect or on unmount
    };
  }, [roomId, processedStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_room', { roomId });
        disconnectSocket();
        socketRef.current = null;
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [roomId]);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const leaveRoom = () => {
    router.push('/');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleScreenShareToggle = (stream: MediaStream | null) => {
    setScreenStream(stream);
    if (stream) {
      setProcessedStream(stream);
    } else {
      setProcessedStream(localStream);
    }
  };

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Room: {roomId}
            </h1>
            <p className="text-sm text-muted-foreground">Participants: {peers.size + 1}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && !localStream && (
        <div className="flex-shrink-0 mx-6 mt-4 bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <Button
            onClick={() => setError('')}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-red-700"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 flex items-center justify-center px-6 py-6 overflow-hidden">
        <VideoGrid
          localStream={processedStream}
          peers={Array.from(peers.values())}
          isVideoEnabled={isVideoEnabled}
        />
      </div>

      {/* Unified Control Bar */}
      {localStream && (
        <UnifiedControlBar
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          localStream={processedStream}
          onScreenShareToggle={handleScreenShareToggle}
          onLeaveRoom={leaveRoom}
          socket={socketRef.current}
          roomId={roomId}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          currentBackground={currentBackground}
          onBackgroundChange={(bg, imageUrl) => {
            setCurrentBackground(bg);
            if (imageUrl) {
              setBackgroundImageUrl(imageUrl);
            }
          }}
        />
      )}

      {/* Chat */}
      {socketRef.current && isChatOpen && (
        <ChatBox
          socket={socketRef.current}
          roomId={roomId}
          localPeerId={socketRef.current.id || 'local'}
        />
      )}

      {/* Reactions */}
      {socketRef.current && (
        <ReactionsOverlay
          socket={socketRef.current}
          roomId={roomId}
        />
      )}
    </div>
  );
}

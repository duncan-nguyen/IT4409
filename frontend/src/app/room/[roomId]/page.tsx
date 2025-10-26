'use client';

import ChatBox from '@/components/ChatBox';
import PreJoinScreen from '@/components/PreJoinScreen';
import ReactionsOverlay from '@/components/ReactionsOverlay';
import UnifiedControlBar from '@/components/UnifiedControlBar';
import VideoGrid from '@/components/VideoGrid';
import { VirtualBackgroundType } from '@/components/VirtualBackgroundSelector';
import WaitingRoomList from '@/components/WaitingRoomList';
import { Button } from '@/components/ui/button';
import { FilterType, Peer } from '@/types';
import { CombinedProcessor } from '@/utils/combinedProcessor';
import { ConnectionMonitor } from '@/utils/connectionMonitor';
import { NetworkAdapter } from '@/utils/networkAdapter';
import { disconnectSocket, initSocket } from '@/utils/socket';
import { PeerConnection } from '@/utils/webrtc';
import { AIServiceConnection } from '@/utils/webrtc-ai';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params?.roomId as string;
  const initialUsername = searchParams.get('username') || '';

  const [hasJoined, setHasJoined] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [selectedDevices, setSelectedDevices] = useState<{ audioInput?: string; videoInput?: string; audioOutput?: string }>({});
  const [role, setRole] = useState<'host' | 'participant'>('participant');
  const [status, setStatus] = useState<'waiting' | 'joined'>('joined');
  const [waitingUsers, setWaitingUsers] = useState<{ peerId: string; username?: string }[]>([]);

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
  const monitorsRef = useRef<Map<string, { monitor: ConnectionMonitor; adapter: NetworkAdapter }>>(new Map());
  const socketRef = useRef<ReturnType<typeof initSocket> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const aiConnectionRef = useRef<AIServiceConnection | null>(null);
  const combinedProcessorRef = useRef<CombinedProcessor | null>(null);

  // Initialize camera
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedDevices.videoInput ? { exact: selectedDevices.videoInput } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            deviceId: selectedDevices.audioInput ? { exact: selectedDevices.audioInput } : undefined,
          },
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
      if (combinedProcessorRef.current) {
        combinedProcessorRef.current.stop();
      }
    };
  }, [hasJoined, selectedDevices]); // Re-run when joined or devices change

  // AI Processing Pipeline with Combined Processor
  useEffect(() => {
    const processVideo = async () => {
      if (!localStream) return;

      const needsFaceDetection = currentFilter === 'face-detection';
      const needsBackground = currentBackground !== 'none';
      const filterType = ['grayscale', 'sepia', 'blur'].includes(currentFilter as string)
        ? (currentFilter as 'grayscale' | 'sepia' | 'blur')
        : 'none';

      // If no processing needed, use original stream
      if (!needsFaceDetection && !needsBackground && filterType === 'none') {
        if (combinedProcessorRef.current) {
          combinedProcessorRef.current.stop();
          combinedProcessorRef.current = null;
        }
        setProcessedStream(localStream);
        console.log(' Using original stream (no processing)');
        return;
      }

      try {
        // If processor exists, just update options
        if (combinedProcessorRef.current) {
          await combinedProcessorRef.current.updateOptions({
            enableFaceDetection: needsFaceDetection,
            backgroundType: currentBackground,
            backgroundImageUrl: backgroundImageUrl || undefined,
            filterType,
          });
          console.log('🔄 Updated processor options');
          return;
        }

        // Create new combined processor
        console.log('🔄 Starting combined processor...');
        combinedProcessorRef.current = new CombinedProcessor({
          enableFaceDetection: needsFaceDetection,
          backgroundType: currentBackground,
          backgroundImageUrl: backgroundImageUrl || undefined,
          filterType,
        });

        const processedStream = await combinedProcessorRef.current.initialize(localStream);
        setProcessedStream(processedStream);
        console.log(' Combined processor active');
      } catch (error) {
        console.error('Failed to start combined processor:', error);
        setProcessedStream(localStream);
      }
    };

    processVideo();
  }, [localStream, currentFilter, currentBackground, backgroundImageUrl]);

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
    if (!processedStream || !roomId || !hasJoined) return;

    // Only init socket once
    if (!socketRef.current) {
      const socket = initSocket();
      socketRef.current = socket;

      socket.emit('join_room', { roomId, username });

      socket.on('room_joined', ({ role, status }) => {
        console.log('Joined room as:', role, status);
        setRole(role);
        setStatus(status);
      });

      socket.on('kicked', () => {
        alert('You have been kicked from the room.');
        leaveRoom();
      });

      socket.on('muted_by_host', () => {
        if (localStream) {
          const audioTrack = localStream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
            setIsAudioEnabled(false);
          }
        }
        alert('You have been muted by the host.');
      });

      socket.on('approved', () => {
        setStatus('joined');
      });

      socket.on('user_waiting', ({ peerId, username }) => {
        console.log('User waiting:', peerId, username);
        setWaitingUsers((prev) => [...prev, { peerId, username }]);
      });

      socket.on('existing_peers', ({ peers }: { peers: Peer[] }) => {
        console.log('Existing peers:', peers);
        peers.forEach((peer) => {
          const pc = new PeerConnection(peer.peerId, (stream) => {
            setPeers((prev) => {
              const newPeers = new Map(prev);
              newPeers.set(peer.peerId, { ...peer, stream });
              return newPeers;
            });
          });

          if (processedStream) {
            pc.addStream(processedStream);
          }

          // Start connection monitoring and basic adaptation
          {
            const monitor = new ConnectionMonitor(pc.getPeerConnection());
            const adapter = new NetworkAdapter(pc.getPeerConnection());
            monitor.startMonitoring(async (q) => {
              // Simple adaptation: adjust resolution based on quality tier
              if (q.quality === 'poor') {
                await adapter.adjustResolution('low');
              } else if (q.quality === 'fair') {
                await adapter.adjustResolution('medium');
              } else {
                await adapter.adjustResolution('high');
              }
            }, 4000);
            monitorsRef.current.set(peer.peerId, { monitor, adapter });
          }

          // Create offer for existing peer
          pc.createOffer().then((offer) => {
            socket.emit('offer', { roomId, peerId: peer.peerId, offer });
          });

          pc.onIceCandidate((candidate) => {
            socket.emit('ice_candidate', { roomId, peerId: peer.peerId, candidate });
          });

          // Auto-renegotiate when needed
          pc.onNegotiationNeeded((offer) => {
            socket.emit('offer', { roomId, peerId: peer.peerId, offer });
          });

          // Attempt recovery on disconnect/failed
          pc.onStateChange(async (state, iceState) => {
            if (state === 'disconnected' || state === 'failed' || iceState === 'disconnected' || iceState === 'failed') {
              try {
                const offer = await pc.restartIce();
                socket.emit('offer', { roomId, peerId: peer.peerId, offer });
              } catch (e) {
                console.error('ICE restart failed:', e);
              }
            }
          });

          peerConnectionsRef.current.set(peer.peerId, pc);
        });
      });

      socket.on('user_joined', async ({ peerId, username: peerUsername, role: peerRole }) => {
        console.log('User joined:', peerId, peerUsername);
        // Remove from waiting list if present
        setWaitingUsers((prev) => prev.filter((u) => u.peerId !== peerId));

        const pc = new PeerConnection(peerId, (stream) => {
          setPeers((prev) => {
            const newPeers = new Map(prev);
            newPeers.set(peerId, { peerId, username: peerUsername, stream, role: peerRole, status: 'joined' });
            return newPeers;
          });
        });

        if (processedStream) {
          pc.addStream(processedStream);
        }

        // Start connection monitoring
        {
          const monitor = new ConnectionMonitor(pc.getPeerConnection());
          const adapter = new NetworkAdapter(pc.getPeerConnection());
          monitor.startMonitoring(async (q) => {
            if (q.quality === 'poor') {
              await adapter.adjustResolution('low');
            } else if (q.quality === 'fair') {
              await adapter.adjustResolution('medium');
            } else {
              await adapter.adjustResolution('high');
            }
          }, 4000);
          monitorsRef.current.set(peerId, { monitor, adapter });
        }

        const offer = await pc.createOffer();
        socket.emit('offer', { roomId, peerId, offer });

        pc.onIceCandidate((candidate) => {
          socket.emit('ice_candidate', { roomId, peerId, candidate });
        });

        pc.onNegotiationNeeded((offer) => {
          socket.emit('offer', { roomId, peerId, offer });
        });

        pc.onStateChange(async (state, iceState) => {
          if (state === 'disconnected' || state === 'failed' || iceState === 'disconnected' || iceState === 'failed') {
            try {
              const offer = await pc.restartIce();
              socket.emit('offer', { roomId, peerId, offer });
            } catch (e) {
              console.error('ICE restart failed:', e);
            }
          }
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

        pc.onNegotiationNeeded((offer) => {
          socket.emit('offer', { roomId, peerId, offer });
        });

        pc.onStateChange(async (state, iceState) => {
          if (state === 'disconnected' || state === 'failed' || iceState === 'disconnected' || iceState === 'failed') {
            try {
              const offer = await pc.restartIce();
              socket.emit('offer', { roomId, peerId, offer });
            } catch (e) {
              console.error('ICE restart failed:', e);
            }
          }
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
        const mon = monitorsRef.current.get(peerId);
        if (mon) {
          mon.monitor.stopMonitoring();
          monitorsRef.current.delete(peerId);
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

  const handleJoinRoom = (name: string, devices: { audioInput?: string; videoInput?: string; audioOutput?: string }) => {
    setUsername(name);
    setSelectedDevices(devices);
    setHasJoined(true);
  };

  const handleApproveUser = (peerId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('approve_user', { roomId, targetPeerId: peerId });
      setWaitingUsers((prev) => prev.filter((u) => u.peerId !== peerId));
    }
  };

  const handleDenyUser = (peerId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('kick_user', { roomId, targetPeerId: peerId });
      setWaitingUsers((prev) => prev.filter((u) => u.peerId !== peerId));
    }
  };

  if (!hasJoined) {
    return <PreJoinScreen onJoin={handleJoinRoom} initialUsername={initialUsername} />;
  }

  if (status === 'waiting') {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1c1c1e] text-white">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">⏳</div>
          <h2 className="text-2xl font-bold">Waiting for Host Approval</h2>
          <p className="text-gray-400">Please wait while the host lets you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-cosmic-900 text-foreground overflow-hidden flex flex-col relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-neon-blue/5 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-neon-purple/5 blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>
      {/* Waiting Room List (Host Only) */}
      {role === 'host' && (
        <WaitingRoomList
          waitingUsers={waitingUsers}
          onApprove={handleApproveUser}
          onDeny={handleDenyUser}
        />
      )}
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
          currentFilter={currentFilter}
          localUsername={username}
          localRole={role}
          onKick={handleDenyUser}
          onMute={(peerId) => {
            if (socketRef.current) {
              socketRef.current.emit('mute_user', { roomId, targetPeerId: peerId });
            }
          }}
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

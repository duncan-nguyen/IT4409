'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { initSocket, disconnectSocket } from '@/utils/socket';
import { PeerConnection } from '@/utils/webrtc';
import {
  loadFaceDetectionModel,
  loadSegmentationModel,
  detectFaces,
  drawFaceDetection,
  applyBackgroundBlur,
  applyVirtualBackground,
} from '@/utils/filters';
import { FilterType, Peer } from '@/types';
import VideoGrid from '@/components/VideoGrid';
import ChatBox from '@/components/ChatBox';
import ReactionsOverlay from '@/components/ReactionsOverlay';
import UnifiedControlBar from '@/components/UnifiedControlBar';
import { VirtualBackgroundType } from '@/components/VirtualBackgroundSelector';
import { Button } from '@/components/ui/button';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId as string;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [currentFilter, setCurrentFilter] = useState<FilterType>('none');
  const [currentBackground, setCurrentBackground] = useState<VirtualBackgroundType>('none');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const animationFrameRef = useRef<number>();
  const socketRef = useRef<ReturnType<typeof initSocket> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const cachedMaskRef = useRef<ImageData | null>(null);
  const isSegmentingRef = useRef<boolean>(false);

  // Initialize camera and canvas
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
        localStreamRef.current = stream;
        setError(''); // Clear any previous errors

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          await videoRef.current.play();
          console.log('✅ Video loaded:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        }

        // Load face detection model
        await loadFaceDetectionModel();
        await loadSegmentationModel();
        setIsModelLoaded(true);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Failed to access camera/microphone. Please check permissions.');
      }
    };

    initMedia();

    return () => {
      // Cleanup on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log('🛑 Stopped track:', track.kind);
        });
        localStreamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (processedStreamRef.current) {
        processedStreamRef.current.getTracks().forEach((track) => track.stop());
        processedStreamRef.current = null;
      }
    };
  }, []);

  // Video processing pipeline
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !localStream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const processFrame = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Reset filter first
        ctx.filter = 'none';

        // Handle virtual backgrounds first (no throttling, run every frame)
        if (currentBackground === 'blur' && isModelLoaded) {
          try {
            await applyBackgroundBlur(video, canvas, ctx);
          } catch (error) {
            console.error('Background blur error:', error);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        } else if (currentBackground === 'image' && backgroundImageRef.current && isModelLoaded) {
          try {
            await applyVirtualBackground(video, canvas, ctx, backgroundImageRef.current);
          } catch (error) {
            console.error('Virtual background error:', error);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        } else {
          // No virtual background, apply filters normally
          switch (currentFilter) {
            case 'blur':
              ctx.filter = 'blur(5px)';
              break;
            case 'grayscale':
              ctx.filter = 'grayscale(100%)';
              break;
            case 'sepia':
              ctx.filter = 'sepia(100%)';
              break;
            case 'vintage':
              ctx.filter = 'sepia(50%) contrast(110%) brightness(110%) saturate(120%)';
              break;
            case 'warm':
              ctx.filter = 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
              break;
            case 'cool':
              ctx.filter = 'saturate(120%) hue-rotate(20deg) brightness(105%)';
              break;
            case 'dramatic':
              ctx.filter = 'grayscale(100%) contrast(140%) brightness(95%)';
              break;
          }

          // Draw video frame with filter applied
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Apply face detection AFTER drawing (works with both filters and backgrounds)
        if (currentFilter === 'face-detection' && isModelLoaded) {
          try {
            if (currentBackground === 'none') {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            const faces = await detectFaces(video);
            drawFaceDetection(ctx, faces);
          } catch (error) {
            console.error('Face detection error:', error);
          }
        }
      } else {
        console.log('⏳ Video not ready:', video.readyState);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();

    // Get processed stream from canvas
    const stream = canvas.captureStream(30);
    
    // Add audio from original stream
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }

    processedStreamRef.current = stream;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [localStream, currentFilter, currentBackground, isModelLoaded]);

  // Load background image when URL changes
  useEffect(() => {
    if (backgroundImageUrl && currentBackground === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        backgroundImageRef.current = img;
        console.log('Background image loaded');
      };
      img.onerror = () => {
        console.error('Failed to load background image');
      };
      img.src = backgroundImageUrl;
    }
  }, [backgroundImageUrl, currentBackground]);

  // WebRTC and signaling
  useEffect(() => {
    if (!localStream || !roomId) return;

    const socket = initSocket();
    socketRef.current = socket;

    // Join room
    socket.emit('join_room', { roomId });

    // Handle new peer joining
    socket.on('user_joined', async ({ peerId }) => {
      console.log('User joined:', peerId);

      const pc = new PeerConnection(peerId, (stream) => {
        setPeers((prev) => {
          const newPeers = new Map(prev);
          newPeers.set(peerId, { peerId, stream });
          return newPeers;
        });
      });

      if (processedStreamRef.current) {
        pc.addStream(processedStreamRef.current);
      }

      const offer = await pc.createOffer();
      socket.emit('offer', { roomId, peerId, offer });

      pc.onIceCandidate((candidate) => {
        socket.emit('ice_candidate', { roomId, peerId, candidate });
      });

      peerConnectionsRef.current.set(peerId, pc);
    });

    // Handle receiving offer
    socket.on('offer', async ({ peerId, offer }) => {
      console.log('Received offer from:', peerId);

      const pc = new PeerConnection(peerId, (stream) => {
        setPeers((prev) => {
          const newPeers = new Map(prev);
          newPeers.set(peerId, { peerId, stream });
          return newPeers;
        });
      });

      if (processedStreamRef.current) {
        pc.addStream(processedStreamRef.current);
      }

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      socket.emit('answer', { roomId, peerId, answer });

      pc.onIceCandidate((candidate) => {
        socket.emit('ice_candidate', { roomId, peerId, candidate });
      });

      peerConnectionsRef.current.set(peerId, pc);
    });

    // Handle receiving answer
    socket.on('answer', async ({ peerId, answer }) => {
      console.log('Received answer from:', peerId);
      const pc = peerConnectionsRef.current.get(peerId);
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    });

    // Handle ICE candidate
    socket.on('ice_candidate', async ({ peerId, candidate }) => {
      const pc = peerConnectionsRef.current.get(peerId);
      if (pc) {
        await pc.addIceCandidate(candidate);
      }
    });

    // Handle user leaving
    socket.on('user_left', ({ peerId }) => {
      console.log('User left:', peerId);
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

    return () => {
      socket.emit('leave_room', { roomId });
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      disconnectSocket();
    };
  }, [roomId, localStream]);

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
    console.log('👋 Leaving room...');
    
    // Stop all media tracks (camera and microphone)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('🛑 Stopped track on leave:', track.kind);
      });
      localStreamRef.current = null;
    }
    
    if (processedStreamRef.current) {
      processedStreamRef.current.getTracks().forEach((track) => track.stop());
      processedStreamRef.current = null;
    }

    // Stop screen share if active
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('leave_room', { roomId });
      disconnectSocket();
      socketRef.current = null;
    }
    
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Reset states
    setLocalStream(null);
    setPeers(new Map());
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    
    // Navigate to home and reload to reset all states
    router.push('/');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleScreenShareToggle = (stream: MediaStream | null) => {
    setScreenStream(stream);
    
    if (stream) {
      // Stop processing camera video while sharing screen
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Create a new stream from screen share for display
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();

          const drawScreen = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            animationFrameRef.current = requestAnimationFrame(drawScreen);
          };

          video.onloadedmetadata = () => {
            drawScreen();
          };
        }
      }

      // Replace video track in all peer connections with screen share
      const screenVideoTrack = stream.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getPeerConnection().getSenders().find((s: RTCRtpSender) => s.track?.kind === 'video');
        if (sender && processedStreamRef.current) {
          const canvasStream = canvasRef.current?.captureStream(30);
          if (canvasStream) {
            sender.replaceTrack(canvasStream.getVideoTracks()[0]);
          }
        }
      });
    } else {
      // Switch back to camera - restart video processing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Restart camera processing (this will be handled by the existing useEffect)
      if (localStream && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const processFrame = async () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.filter = 'none';

              switch (currentFilter) {
                case 'blur':
                  ctx.filter = 'blur(5px)';
                  break;
                case 'grayscale':
                  ctx.filter = 'grayscale(100%)';
                  break;
                case 'sepia':
                  ctx.filter = 'sepia(100%)';
                  break;
              }

              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              if (currentFilter === 'face-detection' && isModelLoaded) {
                try {
                  const faces = await detectFaces(video);
                  drawFaceDetection(ctx, faces);
                } catch (error) {
                  console.error('Face detection error:', error);
                }
              }
            }
            animationFrameRef.current = requestAnimationFrame(processFrame);
          };

          processFrame();
        }
      }

      // Switch back peer connections to camera
      if (processedStreamRef.current) {
        const cameraVideoTrack = processedStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getPeerConnection().getSenders().find((s: RTCRtpSender) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraVideoTrack);
          }
        });
      }
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
      {error && localStream === null && (
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

      {/* Video Grid - Centered and fills remaining space */}
      <div className="flex-1 flex items-center justify-center px-6 py-6 overflow-hidden">
        <VideoGrid
          localStream={processedStreamRef.current}
          peers={Array.from(peers.values())}
          canvasRef={canvasRef}
          isVideoEnabled={isVideoEnabled}
        />
      </div>

      {/* Unified Control Bar - Always show when local stream is ready */}
      {localStream && (
        <UnifiedControlBar
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          localStream={processedStreamRef.current}
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

      {/* Chat (controlled by UnifiedControlBar) */}
      {socketRef.current && isChatOpen && (
        <ChatBox
          socket={socketRef.current}
          roomId={roomId}
          localPeerId={socketRef.current.id || 'local'}
        />
      )}

      {/* Reactions (always render for receiving) */}
      {socketRef.current && (
        <ReactionsOverlay
          socket={socketRef.current}
          roomId={roomId}
        />
      )}

      {/* Hidden elements for processing */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

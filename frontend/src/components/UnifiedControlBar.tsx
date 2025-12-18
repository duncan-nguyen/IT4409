'use client';

import { FilterType } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Circle,
  Droplet,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Palette,
  Phone,
  Smile,
  Sparkles,
  Square,
  Star,
  ThumbsUp,
  Upload,
  Video,
  VideoOff,
  Wand2,
  X as XIcon,
  Zap
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { VirtualBackgroundType } from './VirtualBackgroundSelector';

interface UnifiedControlBarProps {
  // Video/Audio controls
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;

  // Screen sharing
  localStream: MediaStream | null;
  onScreenShareToggle: (stream: MediaStream | null) => void;

  // Leave room
  onLeaveRoom: () => void;

  // Chat & Reactions
  socket: any;
  roomId: string;
  onToggleChat: () => void;

  // Filters
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  currentBackground: VirtualBackgroundType;
  onBackgroundChange: (bg: VirtualBackgroundType, image?: string) => void;
}

export default function UnifiedControlBar({
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  localStream,
  onScreenShareToggle,
  onLeaveRoom,
  socket,
  roomId,
  onToggleChat,
  currentFilter,
  onFilterChange,
  currentBackground,
  onBackgroundChange,
}: UnifiedControlBarProps) {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reactionIcons = [
    { type: 'heart', icon: Heart, color: 'text-red-500' },
    { type: 'like', icon: ThumbsUp, color: 'text-blue-500' },
    { type: 'smile', icon: Smile, color: 'text-yellow-500' },
    { type: 'star', icon: Star, color: 'text-purple-500' },
    { type: 'zap', icon: Zap, color: 'text-orange-500' },
  ];

  const filters = [
    { value: 'none' as const, label: 'None', icon: XIcon },
    { value: 'blur' as const, label: 'Blur BG', icon: Droplet },
    { value: 'grayscale' as const, label: 'B&W', icon: ImageIcon },
    { value: 'sepia' as const, label: 'Sepia', icon: Palette },
    { value: 'vintage' as const, label: 'Vintage', icon: Sparkles },
    { value: 'warm' as const, label: 'Warm', icon: Sparkles },
    { value: 'cool' as const, label: 'Cool', icon: Droplet },
    { value: 'dramatic' as const, label: 'Drama', icon: Palette },
    { value: 'face-detection' as const, label: 'Face', icon: Sparkles },
  ];

  const backgrounds = [
    { value: 'none' as const, label: 'No BG', icon: XIcon },
    { value: 'blur' as const, label: 'Blur BG', icon: Sparkles },
    { value: 'image' as const, label: 'Custom', icon: ImageIcon },
  ];

  const presetImages = [
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop', name: 'Mountains' },
    { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1280&h=720&fit=crop', name: 'Stars' },
    { url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1280&h=720&fit=crop', name: 'Gradient' },
    { url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1280&h=720&fit=crop', name: 'Beach' },
    { url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1280&h=720&fit=crop', name: 'Abstract' },
    { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1280&h=720&fit=crop', name: 'Ocean' },
    { url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1280&h=720&fit=crop', name: 'Space' },
    { url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1280&h=720&fit=crop', name: 'Forest' },
  ];

  const sendReaction = (type: string) => {
    if (socket) {
      socket.emit('send_reaction', { roomId, type });
    }
    setShowReactionsMenu(false);
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        } as DisplayMediaStreamOptions['video'],
        audio: false,
      });

      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      onScreenShareToggle(screenStream);

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    onScreenShareToggle(null);
  };

  const startRecording = () => {
    if (!localStream) return;

    try {
      const mediaRecorder = new MediaRecorder(localStream, {
        mimeType: 'video/webm; codecs=vp9'
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        onBackgroundChange('image', imageUrl);
        setShowFiltersMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pointer-events-auto"
      >
        {/* Main Control Bar */}
        <div className="glass-panel rounded-full px-6 py-3 flex items-center gap-3 mx-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10 bg-black/40 backdrop-blur-2xl">
          {/* Microphone */}
          <Button
            onClick={onToggleAudio}
            size="icon"
            variant="ghost"
            className={`h-12 w-12 rounded-full transition-all duration-300 hover:scale-110 ${isAudioEnabled
                ? 'hover:bg-white/10 text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          {/* Camera */}
          <Button
            onClick={onToggleVideo}
            size="icon"
            variant="ghost"
            className={`h-12 w-12 rounded-full transition-all duration-300 hover:scale-110 ${isVideoEnabled
                ? 'hover:bg-white/10 text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              }`}
            title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
          >
            {isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          {/* Screen Share */}
          <Button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            size="icon"
            variant="ghost"
            className={`h-12 w-12 rounded-full transition-all duration-300 hover:scale-110 ${isScreenSharing
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                : 'hover:bg-white/10 text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              }`}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? (
              <MonitorOff className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
          </Button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Reactions */}
          <Button
            onClick={() => setShowReactionsMenu(!showReactionsMenu)}
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full hover:bg-white/10 text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            title="Reactions"
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* Chat */}
          <Button
            onClick={onToggleChat}
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full hover:bg-white/10 text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            title="Chat"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>

          {/* Filters & Effects */}
          <Button
            onClick={() => setShowFiltersMenu(!showFiltersMenu)}
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full hover:bg-white/10 text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            title="Filters & Effects"
          >
            <Wand2 className="h-5 w-5" />
          </Button>

          {/* Recording */}
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            size="icon"
            variant="ghost"
            className={`h-12 w-12 rounded-full transition-all duration-300 hover:scale-110 ${isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'hover:bg-white/10 text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              }`}
            title={isRecording ? 'Stop Recording' : 'Record'}
          >
            {isRecording ? (
              <Square className="h-4 w-4 fill-white animate-pulse" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Leave Call */}
          <Button
            onClick={onLeaveRoom}
            size="icon"
            className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-300 hover:scale-110 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            title="Leave Call"
          >
            <Phone className="h-5 w-5 rotate-[135deg]" />
          </Button>
        </div>

        {/* Reactions Menu Popup */}
        <AnimatePresence>
          {showReactionsMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 glass-panel rounded-2xl p-3 flex gap-2 bg-black/60"
            >
              {reactionIcons.map(({ type, icon: Icon, color }) => (
                <Button
                  key={type}
                  onClick={() => sendReaction(type)}
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12 rounded-full hover:bg-white/10 transition-all hover:scale-125"
                >
                  <Icon className={`h-6 w-6 ${color} drop-shadow-lg`} />
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Effects Menu Popup */}
        <AnimatePresence>
          {showFiltersMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 glass-panel rounded-2xl p-0 min-w-[360px] max-w-[400px] max-h-[70vh] flex flex-col bg-black/60 overflow-hidden"
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">Effects Studio</h3>
              </div>

              {/* Scrollable Content */}
              <div
                className="overflow-y-auto p-4 space-y-6"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                }}
              >
                {/* Filters Section */}
                <div>
                  <h3 className="text-xs font-semibold mb-3 text-gray-400 uppercase tracking-wide">Filters</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {filters.map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        onClick={() => {
                          onFilterChange(value);
                          setShowFiltersMenu(false);
                        }}
                        variant="ghost"
                        className={`h-20 flex flex-col items-center justify-center gap-2 rounded-xl transition-all border ${currentFilter === value
                            ? 'bg-neon-blue/20 text-neon-blue border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300 hover:border-white/20'
                          }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-[10px] font-medium">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Backgrounds Section */}
                <div>
                  <h3 className="text-xs font-semibold mb-3 text-gray-400 uppercase tracking-wide">Virtual Background</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {backgrounds.map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        onClick={() => {
                          onBackgroundChange(value);
                          if (value !== 'image') {
                            setShowFiltersMenu(false);
                          }
                        }}
                        variant="ghost"
                        className={`h-20 flex flex-col items-center justify-center gap-2 rounded-xl transition-all border ${currentBackground === value
                            ? 'bg-neon-purple/20 text-neon-purple border-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.2)]'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300 hover:border-white/20'
                          }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-[10px] font-medium">{label}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Preset Background Images */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Presets</h4>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10"
                      >
                        <Upload className="w-3 h-3 mr-2" />
                        Upload
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {presetImages.map((img, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:border-neon-purple transition-all h-24 group"
                          onClick={() => {
                            onBackgroundChange('image', img.url);
                            setShowFiltersMenu(false);
                          }}
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end">
                            <span className="text-white text-xs font-medium p-2">{img.name}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

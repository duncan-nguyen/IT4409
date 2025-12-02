'use client';

import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Circle,
  Square,
  Phone,
  ChevronUp,
  Smile,
  MessageCircle,
  Hand,
  MoreVertical,
  Heart,
  ThumbsUp,
  Star,
  Zap,
  Wand2,
  Sparkles,
  Droplet,
  Palette,
  Image as ImageIcon,
  X as XIcon,
  Filter as FilterIcon,
  Upload
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { FilterType } from '@/types';
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
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-4 pointer-events-none">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="max-w-3xl mx-auto pointer-events-auto"
      >
        {/* Main Control Bar */}
        <div className="bg-[#1c1c1e]/95 backdrop-blur-xl rounded-full px-4 py-2 shadow-2xl border border-white/10 mx-4">
          <div className="flex items-center justify-center gap-1">
            {/* Microphone */}
            <Button
              onClick={onToggleAudio}
              size="icon"
              variant="ghost"
              className={`h-11 w-11 rounded-full transition-all hover:scale-105 ${
                isAudioEnabled 
                  ? 'hover:bg-white/10 text-white' 
                  : 'bg-red-500/90 hover:bg-red-600 text-white'
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
              className={`h-11 w-11 rounded-full transition-all hover:scale-105 ${
                isVideoEnabled 
                  ? 'hover:bg-white/10 text-white' 
                  : 'bg-red-500/90 hover:bg-red-600 text-white'
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
              className={`h-11 w-11 rounded-full transition-all hover:scale-105 ${
                isScreenSharing 
                  ? 'bg-green-500/90 hover:bg-green-600 text-white' 
                  : 'hover:bg-white/10 text-white'
              }`}
              title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            >
              {isScreenSharing ? (
                <MonitorOff className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
            </Button>

            {/* Reactions */}
            <Button
              onClick={() => setShowReactionsMenu(!showReactionsMenu)}
              size="icon"
              variant="ghost"
              className="h-11 w-11 rounded-full hover:bg-white/10 text-white transition-all hover:scale-105"
              title="Reactions"
            >
              <Smile className="h-5 w-5" />
            </Button>

            {/* Chat */}
            <Button
              onClick={onToggleChat}
              size="icon"
              variant="ghost"
              className="h-11 w-11 rounded-full hover:bg-white/10 text-white transition-all hover:scale-105"
              title="Chat"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>

            {/* Separator */}
            <div className="h-6 w-px bg-white/20 mx-1.5" />

            {/* Recording */}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="icon"
              variant="ghost"
              className={`h-11 w-11 rounded-full transition-all hover:scale-105 ${
                isRecording 
                  ? 'bg-red-500/90 hover:bg-red-600 text-white' 
                  : 'hover:bg-white/10 text-white'
              }`}
              title={isRecording ? 'Stop Recording' : 'Record'}
            >
              {isRecording ? (
                <Square className="h-4 w-4 fill-white animate-pulse" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </Button>

            {/* Filters & Effects */}
            <Button
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              size="icon"
              variant="ghost"
              className="h-11 w-11 rounded-full hover:bg-white/10 text-white transition-all hover:scale-105"
              title="Filters & Effects"
            >
              <Wand2 className="h-5 w-5" />
            </Button>

            {/* Separator */}
            <div className="h-6 w-px bg-white/20 mx-1.5" />

            {/* More */}
            <Button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              size="icon"
              variant="ghost"
              className="h-11 w-11 rounded-full hover:bg-white/10 text-white transition-all hover:scale-105"
              title="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>

            {/* Separator */}
            <div className="h-6 w-px bg-white/20 mx-1.5" />

            {/* Leave Call */}
            <Button
              onClick={onLeaveRoom}
              size="icon"
              className="h-11 w-11 rounded-full bg-red-500/90 hover:bg-red-600 text-white transition-all hover:scale-105 shadow-lg"
              title="Leave Call"
            >
              <Phone className="h-5 w-5 rotate-[135deg]" />
            </Button>
          </div>
        </div>

        {/* Reactions Menu Popup */}
        <AnimatePresence>
          {showReactionsMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#1c1c1e]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-3"
            >
              <div className="flex gap-2">
                {reactionIcons.map(({ type, icon: Icon, color }) => (
                  <Button
                    key={type}
                    onClick={() => sendReaction(type)}
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-full hover:bg-white/10 transition-all hover:scale-110"
                  >
                    <Icon className={`h-6 w-6 ${color}`} />
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* More Menu Popup */}
        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-8 bg-[#1c1c1e] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-3 min-w-[200px]"
            >
              <div className="space-y-1">
                <Button
                  onClick={() => {
                    onToggleChat();
                    setShowMoreMenu(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 rounded-lg"
                >
                  <MessageCircle className="h-4 w-4 mr-3" />
                  Chat
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 rounded-lg"
                >
                  <ChevronUp className="h-4 w-4 mr-3" />
                  Settings
                </Button>
              </div>
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
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#1c1c1e]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 min-w-[320px] max-w-[400px] max-h-[70vh] flex flex-col"
            >
              {/* Scrollable Content */}
              <div 
                className="overflow-y-auto p-4" 
                style={{ 
                  scrollbarWidth: 'thin', 
                  scrollbarColor: '#6b7280 #1f2937',
                }}
              >
                {/* Filters Section */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wide">Filters</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {filters.map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        onClick={() => {
                          onFilterChange(value);
                          setShowFiltersMenu(false);
                        }}
                        variant="ghost"
                        className={`h-16 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                          currentFilter === value
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                            : 'hover:bg-white/10 text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px]">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Backgrounds Section */}
                <div>
                  <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wide">Virtual Background</h3>
                  <div className="grid grid-cols-3 gap-2 mb-3">
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
                        className={`h-16 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                          currentBackground === value
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                            : 'hover:bg-white/10 text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px]">{label}</span>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Preset Background Images - Always visible */}
                  <div>
                    <h4 className="text-[10px] font-semibold mb-2 text-gray-500 uppercase tracking-wide">Preset Backgrounds</h4>
                    
                    {/* Upload Button */}
                    <div className="mb-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        className="w-full h-12 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/50 rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="text-xs font-medium">Upload Your Image</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {presetImages.map((img, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-white/10 hover:border-purple-500 transition-all h-20"
                          onClick={() => {
                            onBackgroundChange('image', img.url);
                            setShowFiltersMenu(false);
                          }}
                        >
                          <img 
                            src={img.url} 
                            alt={img.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                            <span className="text-white text-[10px] font-medium p-1.5">{img.name}</span>
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

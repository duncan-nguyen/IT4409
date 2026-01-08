'use client';

import { motion } from 'framer-motion';
import { Mic, MicOff, Sparkles, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DeviceSelector from './DeviceSelector';
import { Button } from './ui/button';

interface PreJoinScreenProps {
    onJoin: (username: string, devices: { audioInput?: string; videoInput?: string; audioOutput?: string }) => void;
    initialUsername?: string;
}

export default function PreJoinScreen({ onJoin, initialUsername = '' }: PreJoinScreenProps) {
    const [username, setUsername] = useState(initialUsername);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    const [selectedAudioInput, setSelectedAudioInput] = useState<string>();
    const [selectedVideoInput, setSelectedVideoInput] = useState<string>();
    const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>();
    const [isInitialized, setIsInitialized] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Initial stream setup
    useEffect(() => {
        startStream();
        return () => {
            stopStream();
        };
    }, []);

    // Restart stream when device selection changes (after initial setup)
    useEffect(() => {
        if (isInitialized && (selectedAudioInput || selectedVideoInput)) {
            startStream();
        }
    }, [selectedAudioInput, selectedVideoInput]);

    // Re-assign srcObject when video is re-enabled (video element gets re-mounted)
    useEffect(() => {
        if (isVideoEnabled && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [isVideoEnabled, stream]);

    const startStream = async () => {
        stopStream();
        try {
            const constraints: MediaStreamConstraints = {
                audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
                video: selectedVideoInput ? { deviceId: { exact: selectedVideoInput }, width: 1280, height: 720 } : true,
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);

            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }

            // Update initial selection if not set (only on first run)
            if (!isInitialized) {
                const audioTrack = newStream.getAudioTracks()[0];
                const videoTrack = newStream.getVideoTracks()[0];
                if (audioTrack && !selectedAudioInput) {
                    setSelectedAudioInput(audioTrack.getSettings().deviceId);
                }
                if (videoTrack && !selectedVideoInput) {
                    setSelectedVideoInput(videoTrack.getSettings().deviceId);
                }
                setIsInitialized(true);
            }

        } catch (error) {
            console.error('Error starting stream:', error);
        }
    };

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const handleDeviceChange = (deviceId: string, kind: MediaDeviceKind) => {
        if (kind === 'audioinput') setSelectedAudioInput(deviceId);
        if (kind === 'videoinput') setSelectedVideoInput(deviceId);
        if (kind === 'audiooutput') setSelectedAudioOutput(deviceId);
    };

    const handleJoin = () => {
        if (username.trim()) {
            // Stop the preview stream so the main room can acquire it freshly with correct IDs
            stopStream();
            onJoin(username, {
                audioInput: selectedAudioInput,
                videoInput: selectedVideoInput,
                audioOutput: selectedAudioOutput
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cosmic-900 text-white p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-neon-blue/10 blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-neon-purple/10 blur-[120px] animate-pulse-slow delay-1000" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10"
            >

                {/* Preview Section */}
                <div className="space-y-6">
                    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 bg-black/40 backdrop-blur-sm group">
                        {isVideoEnabled ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover scale-x-[-1]"
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

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                            <Button
                                onClick={toggleAudio}
                                variant="ghost"
                                size="icon"
                                className={`h-12 w-12 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 ${!isAudioEnabled
                                    ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                    : 'bg-black/40 hover:bg-white/10 text-white'
                                    }`}
                            >
                                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </Button>
                            <Button
                                onClick={toggleVideo}
                                variant="ghost"
                                size="icon"
                                className={`h-12 w-12 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 ${!isVideoEnabled
                                    ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                    : 'bg-black/40 hover:bg-white/10 text-white'
                                    }`}
                            >
                                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4 text-neon-purple" />
                            Check your look before joining!
                        </p>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex flex-col justify-center space-y-8 p-6 glass-panel rounded-3xl">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Ready to join?
                        </h1>
                        <p className="text-gray-400">Setup your devices and enter your name.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Display Name</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all"
                            />
                        </div>

                        <DeviceSelector
                            onDeviceChange={handleDeviceChange}
                            selectedAudioInput={selectedAudioInput}
                            selectedVideoInput={selectedVideoInput}
                            selectedAudioOutput={selectedAudioOutput}
                        />
                    </div>

                    <Button
                        onClick={handleJoin}
                        disabled={!username.trim()}
                        size="lg"
                        variant="cosmic"
                        className="w-full h-14 text-lg font-semibold shadow-lg shadow-neon-blue/20"
                    >
                        Join Room
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

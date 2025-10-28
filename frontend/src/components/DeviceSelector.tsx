'use client';

import { Mic, Speaker, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DeviceSelectorProps {
    onDeviceChange: (deviceId: string, kind: MediaDeviceKind) => void;
    selectedAudioInput?: string;
    selectedVideoInput?: string;
    selectedAudioOutput?: string;
}

export default function DeviceSelector({
    onDeviceChange,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
}: DeviceSelectorProps) {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permission to list labels
                await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                setHasPermission(true);

                const deviceList = await navigator.mediaDevices.enumerateDevices();
                setDevices(deviceList);
            } catch (error) {
                console.error('Error enumerating devices:', error);
            }
        };

        getDevices();

        navigator.mediaDevices.addEventListener('devicechange', getDevices);
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', getDevices);
        };
    }, []);

    const audioInputs = devices.filter((d) => d.kind === 'audioinput');
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');
    const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

    if (!hasPermission) {
        return (
            <div className="text-center p-4 text-muted-foreground">
                Please allow camera and microphone access to select devices.
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full max-w-md">
            {/* Audio Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-2 text-gray-400 uppercase tracking-wider ml-1">
                    <Mic className="w-3 h-3 text-neon-blue" /> Microphone
                </label>
                <div className="relative">
                    <select
                        className="w-full h-12 appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all cursor-pointer hover:bg-white/10"
                        value={selectedAudioInput}
                        onChange={(e) => onDeviceChange(e.target.value, 'audioinput')}
                    >
                        {audioInputs.map((device) => (
                            <option key={device.deviceId} value={device.deviceId} className="bg-gray-900 text-white">
                                {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Video Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-2 text-gray-400 uppercase tracking-wider ml-1">
                    <Video className="w-3 h-3 text-neon-purple" /> Camera
                </label>
                <div className="relative">
                    <select
                        className="w-full h-12 appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all cursor-pointer hover:bg-white/10"
                        value={selectedVideoInput}
                        onChange={(e) => onDeviceChange(e.target.value, 'videoinput')}
                    >
                        {videoInputs.map((device) => (
                            <option key={device.deviceId} value={device.deviceId} className="bg-gray-900 text-white">
                                {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Audio Output (Speakers) - Only works on Chrome/Edge */}
            {audioOutputs.length > 0 && (
                <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-2 text-gray-400 uppercase tracking-wider ml-1">
                        <Speaker className="w-3 h-3 text-neon-pink" /> Speaker
                    </label>
                    <div className="relative">
                        <select
                            className="w-full h-12 appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all cursor-pointer hover:bg-white/10"
                            value={selectedAudioOutput}
                            onChange={(e) => onDeviceChange(e.target.value, 'audiooutput')}
                        >
                            {audioOutputs.map((device) => (
                                <option key={device.deviceId} value={device.deviceId} className="bg-gray-900 text-white">
                                    {device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

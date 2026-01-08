'use client';

import { Mic, Speaker, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import CustomSelect from './ui/custom-select';

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
        <div className="space-y-5 w-full">
            {/* Audio Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-2 text-gray-400 uppercase tracking-wider ml-1">
                    <div className="p-1.5 rounded-lg bg-neon-blue/10">
                        <Mic className="w-3.5 h-3.5 text-neon-blue" />
                    </div>
                    Microphone
                </label>
                <CustomSelect
                    options={audioInputs.map((device) => ({
                        value: device.deviceId,
                        label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
                    }))}
                    value={selectedAudioInput}
                    onChange={(value) => onDeviceChange(value, 'audioinput')}
                    placeholder="Select microphone"
                    accentColor="blue"
                />
            </div>

            {/* Video Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-2 text-gray-400 uppercase tracking-wider ml-1">
                    <div className="p-1.5 rounded-lg bg-neon-purple/10">
                        <Video className="w-3.5 h-3.5 text-neon-purple" />
                    </div>
                    Camera
                </label>
                <CustomSelect
                    options={videoInputs.map((device) => ({
                        value: device.deviceId,
                        label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`,
                    }))}
                    value={selectedVideoInput}
                    onChange={(value) => onDeviceChange(value, 'videoinput')}
                    placeholder="Select camera"
                    accentColor="purple"
                />
            </div>

            {/* Audio Output (Speakers) - Only works on Chrome/Edge */}
            {audioOutputs.length > 0 && (
                <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-2 text-gray-400 uppercase tracking-wider ml-1">
                        <div className="p-1.5 rounded-lg bg-[#ff0080]/10">
                            <Speaker className="w-3.5 h-3.5 text-[#ff0080]" />
                        </div>
                        Speaker
                    </label>
                    <CustomSelect
                        options={audioOutputs.map((device) => ({
                            value: device.deviceId,
                            label: device.label || `Speaker ${device.deviceId.slice(0, 5)}...`,
                        }))}
                        value={selectedAudioOutput}
                        onChange={(value) => onDeviceChange(value, 'audiooutput')}
                        placeholder="Select speaker"
                        accentColor="pink"
                    />
                </div>
            )}
        </div>
    );
}

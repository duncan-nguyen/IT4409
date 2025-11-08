

/**
 * Device information with additional metadata
 */
export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
  isDefault: boolean;
  isActive: boolean;
}

/**
 * Device categories
 */
export type DeviceCategory = 'audioinput' | 'audiooutput' | 'videoinput';

/**
 * Permission state for each device type
 */
export interface PermissionState {
  camera: PermissionStatus | null;
  microphone: PermissionStatus | null;
}

/**
 * Device selection state
 */
export interface DeviceSelection {
  audioInput: string | null;
  audioOutput: string | null;
  videoInput: string | null;
}

/**
 * Device capabilities
 */
export interface DeviceCapabilities {
  width: { min: number; max: number; ideal: number };
  height: { min: number; max: number; ideal: number };
  frameRate: { min: number; max: number; ideal: number };
  facingMode?: string[];
  aspectRatio?: { min: number; max: number };
}

/**
 * Audio constraints for different scenarios
 */
export interface AudioPreset {
  name: string;
  constraints: MediaTrackConstraints;
}

/**
 * Video quality presets
 */
export interface VideoPreset {
  name: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

/**
 * Predefined audio presets for different use cases
 */
export const AUDIO_PRESETS: Record<string, AudioPreset> = {
  default: {
    name: 'Default',
    constraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
  music: {
    name: 'Music',
    constraints: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: 48000,
      channelCount: 2,
    },
  },
  voice: {
    name: 'Voice',
    constraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1,
    },
  },
  broadcast: {
    name: 'Broadcast',
    constraints: {
      echoCancellation: false,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
    },
  },
};

/**
 * Predefined video quality presets
 */
export const VIDEO_PRESETS: Record<string, VideoPreset> = {
  '4k': { name: '4K Ultra HD', width: 3840, height: 2160, frameRate: 30, bitrate: 15000000 },
  '1080p': { name: '1080p Full HD', width: 1920, height: 1080, frameRate: 30, bitrate: 4000000 },
  '720p': { name: '720p HD', width: 1280, height: 720, frameRate: 30, bitrate: 2500000 },
  '540p': { name: '540p', width: 960, height: 540, frameRate: 25, bitrate: 1500000 },
  '480p': { name: '480p SD', width: 854, height: 480, frameRate: 25, bitrate: 1000000 },
  '360p': { name: '360p', width: 640, height: 360, frameRate: 20, bitrate: 600000 },
  '240p': { name: '240p', width: 426, height: 240, frameRate: 15, bitrate: 300000 },
};

/**
 * Enumerate all available media devices
 */
export async function enumerateDevices(): Promise<DeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `${getDeviceTypeLabel(device.kind)} ${index + 1}`,
      kind: device.kind,
      groupId: device.groupId,
      isDefault: device.deviceId === 'default' || device.label.toLowerCase().includes('default'),
      isActive: false,
    }));
  } catch (error) {
    console.error('Failed to enumerate devices:', error);
    return [];
  }
}

/**
 * Get devices by category
 */
export async function getDevicesByCategory(category: DeviceCategory): Promise<DeviceInfo[]> {
  const devices = await enumerateDevices();
  return devices.filter((device) => device.kind === category);
}

/**
 * Get human-readable device type label
 */
export function getDeviceTypeLabel(kind: MediaDeviceKind): string {
  switch (kind) {
    case 'audioinput':
      return 'Microphone';
    case 'audiooutput':
      return 'Speaker';
    case 'videoinput':
      return 'Camera';
    default:
      return 'Unknown Device';
  }
}

/**
 * Request media permissions
 */
export async function requestMediaPermissions(
  audio: boolean = true,
  video: boolean = true
): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audio ? AUDIO_PRESETS.default.constraints : false,
      video: video ? { width: 1280, height: 720 } : false,
    });
    return stream;
  } catch (error) {
    console.error('Failed to get media permissions:', error);
    return null;
  }
}

/**
 * Check if device permissions are granted
 */
export async function checkPermissions(): Promise<PermissionState> {
  const result: PermissionState = {
    camera: null,
    microphone: null,
  };

  try {
    if (navigator.permissions) {
      const [camera, microphone] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName }),
      ]);
      result.camera = camera;
      result.microphone = microphone;
    }
  } catch (error) {
    console.warn('Permissions API not fully supported:', error);
  }

  return result;
}

/**
 * Get video device capabilities
 */
export async function getVideoCapabilities(deviceId: string): Promise<DeviceCapabilities | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
    });

    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    // Stop the test stream
    stream.getTracks().forEach((t) => t.stop());

    return {
      width: {
        min: capabilities.width?.min || 320,
        max: capabilities.width?.max || 1920,
        ideal: capabilities.width?.ideal || 1280,
      },
      height: {
        min: capabilities.height?.min || 240,
        max: capabilities.height?.max || 1080,
        ideal: capabilities.height?.ideal || 720,
      },
      frameRate: {
        min: capabilities.frameRate?.min || 15,
        max: capabilities.frameRate?.max || 60,
        ideal: capabilities.frameRate?.ideal || 30,
      },
      facingMode: capabilities.facingMode,
      aspectRatio: capabilities.aspectRatio
        ? { min: capabilities.aspectRatio.min || 1, max: capabilities.aspectRatio.max || 2 }
        : undefined,
    };
  } catch (error) {
    console.error('Failed to get device capabilities:', error);
    return null;
  }
}

/**
 * Switch to a different video device
 */
export async function switchVideoDevice(
  currentStream: MediaStream | null,
  newDeviceId: string,
  constraints?: MediaTrackConstraints
): Promise<MediaStream | null> {
  try {
    // Stop current video track
    if (currentStream) {
      currentStream.getVideoTracks().forEach((track) => track.stop());
    }

    // Get new stream with specified device
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: newDeviceId },
        ...constraints,
      },
    });

    // If there was audio in the old stream, copy it
    if (currentStream) {
      currentStream.getAudioTracks().forEach((track) => {
        newStream.addTrack(track);
      });
    }

    return newStream;
  } catch (error) {
    console.error('Failed to switch video device:', error);
    return null;
  }
}

/**
 * Switch to a different audio input device
 */
export async function switchAudioInputDevice(
  currentStream: MediaStream | null,
  newDeviceId: string,
  preset: string = 'default'
): Promise<MediaStream | null> {
  try {
    // Stop current audio track
    if (currentStream) {
      currentStream.getAudioTracks().forEach((track) => track.stop());
    }

    const audioPreset = AUDIO_PRESETS[preset] || AUDIO_PRESETS.default;

    // Get new audio stream
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: newDeviceId },
        ...audioPreset.constraints,
      },
    });

    // If there was video in the old stream, copy it
    if (currentStream) {
      currentStream.getVideoTracks().forEach((track) => {
        newStream.addTrack(track);
      });
    }

    return newStream;
  } catch (error) {
    console.error('Failed to switch audio device:', error);
    return null;
  }
}

/**
 * Set audio output device (for audio/video elements)
 */
export async function setAudioOutputDevice(
  element: HTMLAudioElement | HTMLVideoElement,
  deviceId: string
): Promise<boolean> {
  try {
    if ('setSinkId' in element) {
      await (element as any).setSinkId(deviceId);
      return true;
    }
    console.warn('setSinkId is not supported in this browser');
    return false;
  } catch (error) {
    console.error('Failed to set audio output device:', error);
    return false;
  }
}

/**
 * Get current active devices from a stream
 */
export function getActiveDevices(stream: MediaStream): DeviceSelection {
  const audioTrack = stream.getAudioTracks()[0];
  const videoTrack = stream.getVideoTracks()[0];

  return {
    audioInput: audioTrack?.getSettings().deviceId || null,
    audioOutput: null, // Cannot be determined from stream
    videoInput: videoTrack?.getSettings().deviceId || null,
  };
}

/**
 * Apply video constraints to a track
 */
export async function applyVideoConstraints(
  track: MediaStreamTrack,
  preset: string
): Promise<boolean> {
  const videoPreset = VIDEO_PRESETS[preset];
  if (!videoPreset) return false;

  try {
    await track.applyConstraints({
      width: { ideal: videoPreset.width },
      height: { ideal: videoPreset.height },
      frameRate: { ideal: videoPreset.frameRate },
    });
    return true;
  } catch (error) {
    console.error('Failed to apply video constraints:', error);
    return false;
  }
}

/**
 * Get optimal video preset based on network conditions
 */
export function getOptimalVideoPreset(bandwidthKbps: number): string {
  if (bandwidthKbps >= 8000) return '1080p';
  if (bandwidthKbps >= 4000) return '720p';
  if (bandwidthKbps >= 2000) return '540p';
  if (bandwidthKbps >= 1000) return '480p';
  if (bandwidthKbps >= 500) return '360p';
  return '240p';
}

/**
 * Check if device is a virtual device (e.g., OBS Virtual Camera)
 */
export function isVirtualDevice(device: DeviceInfo): boolean {
  const virtualKeywords = ['virtual', 'obs', 'manycam', 'xsplit', 'snap camera', 'mmdevice'];
  const label = device.label.toLowerCase();
  return virtualKeywords.some((keyword) => label.includes(keyword));
}

/**
 * Sort devices with real devices first, then virtual
 */
export function sortDevices(devices: DeviceInfo[]): DeviceInfo[] {
  return [...devices].sort((a, b) => {
    // Default device first
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;

    // Then real devices before virtual
    const aVirtual = isVirtualDevice(a);
    const bVirtual = isVirtualDevice(b);
    if (!aVirtual && bVirtual) return -1;
    if (aVirtual && !bVirtual) return 1;

    // Finally alphabetically
    return a.label.localeCompare(b.label);
  });
}

/**
 * Create device change listener
 */
export function onDeviceChange(callback: (devices: DeviceInfo[]) => void): () => void {
  const handler = async () => {
    const devices = await enumerateDevices();
    callback(devices);
  };

  navigator.mediaDevices.addEventListener('devicechange', handler);
  return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
}

/**
 * Test microphone audio level
 */
export async function testMicrophoneLevel(
  deviceId: string,
  duration: number = 3000
): Promise<number[]> {
  const levels: number[] = [];

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    });

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const interval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      levels.push(average);
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, duration));

    clearInterval(interval);
    stream.getTracks().forEach((track) => track.stop());
    audioContext.close();
  } catch (error) {
    console.error('Failed to test microphone:', error);
  }

  return levels;
}

/**
 * Test camera with preview
 */
export async function testCamera(
  deviceId: string,
  videoElement: HTMLVideoElement
): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: 640, height: 480 },
    });

    videoElement.srcObject = stream;
    await videoElement.play();

    return stream;
  } catch (error) {
    console.error('Failed to test camera:', error);
    return null;
  }
}

/**
 * Get device label (handle empty labels)
 */
export function getDeviceLabel(device: MediaDeviceInfo | DeviceInfo, index: number): string {
  if (device.label) return device.label;

  const typeLabel = getDeviceTypeLabel(device.kind);
  return `${typeLabel} ${index + 1}`;
}

/**
 * Check if browser supports screen capture
 */
export function supportsScreenCapture(): boolean {
  return 'getDisplayMedia' in navigator.mediaDevices;
}

/**
 * Check if browser supports audio output selection
 */
export function supportsAudioOutputSelection(): boolean {
  return 'setSinkId' in HTMLAudioElement.prototype;
}

export interface RoomInfo {
  roomId: string;
  name: string;
  participants: number;
  createdAt: string;
}

export interface Peer {
  peerId: string;
  username?: string;
  stream?: MediaStream;
  role?: 'host' | 'participant';
  status?: 'waiting' | 'joined';
}

// Extended filter types including AI modes
export type FilterType =
  | 'none'
  | 'blur'
  | 'grayscale'
  | 'sepia'
  | 'face-detection'
  | 'vintage'
  | 'warm'
  | 'cool'
  | 'high-contrast'
  | 'invert'
  | 'night-vision'
  | 'dramatic'
  // New AI filters
  | 'face-mesh'
  | 'avatar'
  | 'pose-estimation'
  | 'hands'
  | 'beauty'
  | 'cartoon'
  | 'edge-detection';

// Avatar types for AI avatar mode
export type AvatarType = 'cartoon' | 'robot' | 'mask' | 'neon';

export type VirtualBackgroundType = 'none' | 'blur' | 'image';

// Caption/Speech-to-Text types
export interface Caption {
  id: string;
  text: string;
  speaker: string;
  speakerId: string;
  timestamp: number;
  isFinal: boolean;
  language: string;
}

export interface CaptionSettings {
  enabled: boolean;
  language: string;
  showSpeaker: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

// Noise suppression settings
export interface NoiseSuppressionSettings {
  enabled: boolean;
  aggressiveness: 'low' | 'medium' | 'high';
}

// AI processing settings
export interface AIProcessingSettings {
  filterType: FilterType;
  avatarType: AvatarType;
  useServerSide: boolean; // Use AI Service (Python) vs client-side
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

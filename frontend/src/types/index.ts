export interface RoomInfo {
  roomId: string;
  name: string;
  participants: number;
  createdAt: string;
}

export interface Peer {
  peerId: string;
  stream?: MediaStream;
}

export type FilterType = 'none' | 'blur' | 'grayscale' | 'sepia' | 'face-detection' | 'vintage' | 'warm' | 'cool' | 'high-contrast' | 'invert' | 'night-vision' | 'dramatic';

export type VirtualBackgroundType = 'none' | 'blur' | 'image';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

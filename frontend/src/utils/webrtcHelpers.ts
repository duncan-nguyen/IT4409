/**
 * WebRTC Connection Manager - Advanced connection handling utilities
 * @author Nguyen Tan Dung
 * @description Utility functions for WebRTC connection management, ICE handling, and renegotiation
 */

import { IceServer } from '@/types';

/**
 * Connection quality levels
 */
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

/**
 * ICE connection states with additional metadata
 */
export interface IceConnectionInfo {
  state: RTCIceConnectionState;
  timestamp: Date;
  candidatePairsCount: number;
  selectedCandidatePair?: RTCIceCandidatePair;
  localCandidateType?: string;
  remoteCandidateType?: string;
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  packetsLost: number;
  jitter: number;
  roundTripTime: number;
  availableOutgoingBitrate: number;
  availableIncomingBitrate: number;
  timestamp: Date;
}

/**
 * Renegotiation event types
 */
export type RenegotiationReason = 
  | 'track-added'
  | 'track-removed'
  | 'quality-change'
  | 'ice-restart'
  | 'codec-change'
  | 'simulcast-change';

/**
 * Renegotiation request
 */
export interface RenegotiationRequest {
  reason: RenegotiationReason;
  timestamp: Date;
  peerId: string;
  metadata?: Record<string, any>;
}

/**
 * ICE candidate filter options
 */
export interface IceCandidateFilter {
  allowHost: boolean;
  allowSrflx: boolean;
  allowPrflx: boolean;
  allowRelay: boolean;
  preferredProtocol?: 'udp' | 'tcp';
  preferIPv4: boolean;
}

/**
 * Default ICE candidate filter
 */
export const DEFAULT_ICE_FILTER: IceCandidateFilter = {
  allowHost: true,
  allowSrflx: true,
  allowPrflx: true,
  allowRelay: true,
  preferIPv4: true,
};

/**
 * STUN/TURN server configuration helper
 */
export function createIceServers(config: {
  stunUrls?: string[];
  turnUrl?: string;
  turnUsername?: string;
  turnCredential?: string;
  turnCredentialType?: RTCIceCredentialType;
}): IceServer[] {
  const servers: IceServer[] = [];

  // Add STUN servers
  if (config.stunUrls && config.stunUrls.length > 0) {
    servers.push({
      urls: config.stunUrls,
    });
  } else {
    // Default Google STUN servers
    servers.push({
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    });
  }

  // Add TURN server if configured
  if (config.turnUrl && config.turnUsername && config.turnCredential) {
    servers.push({
      urls: config.turnUrl,
      username: config.turnUsername,
      credential: config.turnCredential,
    });

    // Add TURN over TCP as fallback
    if (config.turnUrl.startsWith('turn:')) {
      const tcpUrl = config.turnUrl.replace('turn:', 'turn:') + '?transport=tcp';
      servers.push({
        urls: tcpUrl,
        username: config.turnUsername,
        credential: config.turnCredential,
      });
    }
  }

  return servers;
}

/**
 * Filter ICE candidates based on configuration
 */
export function filterIceCandidate(
  candidate: RTCIceCandidate,
  filter: IceCandidateFilter = DEFAULT_ICE_FILTER
): boolean {
  if (!candidate.candidate) return false;

  const candidateStr = candidate.candidate.toLowerCase();

  // Check candidate type
  const isHost = candidateStr.includes('typ host');
  const isSrflx = candidateStr.includes('typ srflx');
  const isPrflx = candidateStr.includes('typ prflx');
  const isRelay = candidateStr.includes('typ relay');

  if (isHost && !filter.allowHost) return false;
  if (isSrflx && !filter.allowSrflx) return false;
  if (isPrflx && !filter.allowPrflx) return false;
  if (isRelay && !filter.allowRelay) return false;

  // Check protocol preference
  if (filter.preferredProtocol) {
    const isUdp = candidateStr.includes(' udp ');
    const isTcp = candidateStr.includes(' tcp ');

    if (filter.preferredProtocol === 'udp' && !isUdp) return false;
    if (filter.preferredProtocol === 'tcp' && !isTcp) return false;
  }

  // Check IP version preference
  if (filter.preferIPv4) {
    // Simple check for IPv6 (contains ::)
    const hasIPv6 = /[0-9a-f]*:[0-9a-f]*:[0-9a-f]*/i.test(candidateStr);
    const hasIPv4 = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(candidateStr);
    
    if (hasIPv6 && !hasIPv4) return false;
  }

  return true;
}

/**
 * Parse ICE candidate string to extract information
 */
export function parseIceCandidate(candidate: RTCIceCandidate): {
  foundation: string;
  component: string;
  protocol: string;
  priority: number;
  ip: string;
  port: number;
  type: string;
} | null {
  if (!candidate.candidate) return null;

  const regex = /candidate:(\S+) (\d+) (\S+) (\d+) (\S+) (\d+) typ (\S+)/;
  const match = candidate.candidate.match(regex);

  if (!match) return null;

  return {
    foundation: match[1],
    component: match[2],
    protocol: match[3],
    priority: parseInt(match[4], 10),
    ip: match[5],
    port: parseInt(match[6], 10),
    type: match[7],
  };
}

/**
 * Assess connection quality based on stats
 */
export function assessConnectionQuality(stats: ConnectionStats): ConnectionQuality {
  const { roundTripTime, packetsLost, jitter, availableOutgoingBitrate } = stats;

  // Calculate packet loss percentage
  const totalPackets = stats.packetsReceived + packetsLost;
  const lossPercentage = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;

  // Score based on multiple factors
  let score = 100;

  // RTT impact (ideal < 100ms)
  if (roundTripTime > 500) score -= 40;
  else if (roundTripTime > 300) score -= 25;
  else if (roundTripTime > 150) score -= 10;
  else if (roundTripTime > 100) score -= 5;

  // Packet loss impact
  if (lossPercentage > 10) score -= 40;
  else if (lossPercentage > 5) score -= 25;
  else if (lossPercentage > 2) score -= 15;
  else if (lossPercentage > 1) score -= 5;

  // Jitter impact (ideal < 30ms)
  if (jitter > 100) score -= 20;
  else if (jitter > 50) score -= 10;
  else if (jitter > 30) score -= 5;

  // Bitrate impact
  if (availableOutgoingBitrate < 100000) score -= 20;
  else if (availableOutgoingBitrate < 300000) score -= 10;
  else if (availableOutgoingBitrate < 500000) score -= 5;

  // Convert score to quality level
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score > 0) return 'poor';
  return 'disconnected';
}

/**
 * Get recommended video quality based on connection
 */
export function getRecommendedVideoQuality(quality: ConnectionQuality): {
  width: number;
  height: number;
  frameRate: number;
  maxBitrate: number;
} {
  switch (quality) {
    case 'excellent':
      return { width: 1920, height: 1080, frameRate: 30, maxBitrate: 4000000 };
    case 'good':
      return { width: 1280, height: 720, frameRate: 30, maxBitrate: 2500000 };
    case 'fair':
      return { width: 960, height: 540, frameRate: 25, maxBitrate: 1500000 };
    case 'poor':
      return { width: 640, height: 360, frameRate: 20, maxBitrate: 800000 };
    case 'disconnected':
    default:
      return { width: 320, height: 180, frameRate: 15, maxBitrate: 300000 };
  }
}

/**
 * Create SDP munger for bandwidth limiting
 */
export function limitSdpBandwidth(sdp: string, maxBitrateKbps: number): string {
  let lines = sdp.split('\r\n');
  const result: string[] = [];

  for (const line of lines) {
    result.push(line);
    
    // Add bandwidth limit after m= lines
    if (line.startsWith('m=video') || line.startsWith('m=audio')) {
      result.push(`b=AS:${maxBitrateKbps}`);
    }
  }

  return result.join('\r\n');
}

/**
 * Extract codec information from SDP
 */
export function extractCodecsFromSdp(sdp: string): { audio: string[]; video: string[] } {
  const audio: string[] = [];
  const video: string[] = [];
  const lines = sdp.split('\r\n');
  let currentMedia: 'audio' | 'video' | null = null;

  for (const line of lines) {
    if (line.startsWith('m=audio')) {
      currentMedia = 'audio';
    } else if (line.startsWith('m=video')) {
      currentMedia = 'video';
    } else if (line.startsWith('a=rtpmap:')) {
      const match = line.match(/a=rtpmap:\d+ ([^/]+)/);
      if (match && currentMedia) {
        const codec = match[1];
        if (currentMedia === 'audio' && !audio.includes(codec)) {
          audio.push(codec);
        } else if (currentMedia === 'video' && !video.includes(codec)) {
          video.push(codec);
        }
      }
    }
  }

  return { audio, video };
}

/**
 * Calculate optimal reconnection delay with exponential backoff
 */
export function calculateReconnectDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  jitter: boolean = true
): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  if (jitter) {
    // Add random jitter up to 20% of the delay
    const jitterAmount = exponentialDelay * 0.2 * Math.random();
    return exponentialDelay + jitterAmount;
  }
  
  return exponentialDelay;
}

/**
 * ICE restart helper
 */
export async function performIceRestart(
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const offer = await peerConnection.createOffer({ iceRestart: true });
  await peerConnection.setLocalDescription(offer);
  return offer;
}

/**
 * Wait for ICE gathering to complete
 */
export function waitForIceGathering(
  peerConnection: RTCPeerConnection,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (peerConnection.iceGatheringState === 'complete') {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      peerConnection.removeEventListener('icegatheringstatechange', onStateChange);
      reject(new Error('ICE gathering timed out'));
    }, timeout);

    const onStateChange = () => {
      if (peerConnection.iceGatheringState === 'complete') {
        clearTimeout(timeoutId);
        peerConnection.removeEventListener('icegatheringstatechange', onStateChange);
        resolve();
      }
    };

    peerConnection.addEventListener('icegatheringstatechange', onStateChange);
  });
}

/**
 * Get connection stats from RTCPeerConnection
 */
export async function getConnectionStats(
  peerConnection: RTCPeerConnection
): Promise<ConnectionStats> {
  const stats = await peerConnection.getStats();
  const result: ConnectionStats = {
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsSent: 0,
    packetsLost: 0,
    jitter: 0,
    roundTripTime: 0,
    availableOutgoingBitrate: 0,
    availableIncomingBitrate: 0,
    timestamp: new Date(),
  };

  stats.forEach((report) => {
    if (report.type === 'inbound-rtp') {
      result.bytesReceived += report.bytesReceived || 0;
      result.packetsReceived += report.packetsReceived || 0;
      result.packetsLost += report.packetsLost || 0;
      result.jitter = Math.max(result.jitter, report.jitter || 0);
    } else if (report.type === 'outbound-rtp') {
      result.bytesSent += report.bytesSent || 0;
      result.packetsSent += report.packetsSent || 0;
    } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      result.roundTripTime = report.currentRoundTripTime * 1000 || 0;
      result.availableOutgoingBitrate = report.availableOutgoingBitrate || 0;
      result.availableIncomingBitrate = report.availableIncomingBitrate || 0;
    }
  });

  return result;
}

/**
 * Monitor connection and trigger callback on quality change
 */
export function createConnectionMonitor(
  peerConnection: RTCPeerConnection,
  onQualityChange: (quality: ConnectionQuality, stats: ConnectionStats) => void,
  interval: number = 2000
): () => void {
  let lastQuality: ConnectionQuality = 'disconnected';

  const checkConnection = async () => {
    try {
      const stats = await getConnectionStats(peerConnection);
      const quality = assessConnectionQuality(stats);

      if (quality !== lastQuality) {
        lastQuality = quality;
        onQualityChange(quality, stats);
      }
    } catch (error) {
      console.error('Error checking connection stats:', error);
    }
  };

  const intervalId = setInterval(checkConnection, interval);
  checkConnection(); // Initial check

  return () => clearInterval(intervalId);
}

/**
 * Preferred codec setter for transceivers
 */
export function setPreferredCodec(
  transceiver: RTCRtpTransceiver,
  mimeType: string
): void {
  const capabilities = RTCRtpReceiver.getCapabilities(transceiver.receiver.track.kind);
  if (!capabilities) return;

  const preferredCodec = capabilities.codecs.find(
    (codec) => codec.mimeType.toLowerCase() === mimeType.toLowerCase()
  );

  if (preferredCodec) {
    const otherCodecs = capabilities.codecs.filter(
      (codec) => codec.mimeType.toLowerCase() !== mimeType.toLowerCase()
    );
    transceiver.setCodecPreferences([preferredCodec, ...otherCodecs]);
  }
}

/**
 * Generate unique peer ID
 */
export function generatePeerId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `peer_${timestamp}_${random}`;
}

/**
 * Validate SDP format
 */
export function isValidSdp(sdp: string): boolean {
  if (!sdp || typeof sdp !== 'string') return false;
  
  const requiredFields = ['v=', 'o=', 's=', 't='];
  return requiredFields.every((field) => sdp.includes(field));
}

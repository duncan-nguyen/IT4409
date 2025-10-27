export interface ConnectionQuality {
  latency: number;
  jitter: number;
  packetsLost: number;
  totalPackets: number;
  bitrate: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export class ConnectionMonitor {
  private pc: RTCPeerConnection;
  private previousStats: Map<string, any> = new Map();
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(pc: RTCPeerConnection) {
    this.pc = pc;
  }

  async getConnectionQuality(): Promise<ConnectionQuality> {
    const stats = await this.pc.getStats();
    let latency = 0;
    let jitter = 0;
    let packetsLost = 0;
    let totalPackets = 0;
    let bitrate = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        packetsLost = report.packetsLost || 0;
        totalPackets = report.packetsReceived || 0;
        jitter = report.jitter || 0;

        const previousReport = this.previousStats.get(report.id);
        if (previousReport) {
          const timeDiff = report.timestamp - previousReport.timestamp;
          const bytesDiff = report.bytesReceived - previousReport.bytesReceived;
          bitrate = (bytesDiff * 8) / (timeDiff / 1000); // bits per second
        }

        this.previousStats.set(report.id, report);
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime * 1000 || 0; // Convert to ms
      }
    });

    const packetLossRate = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;
    
    let quality: ConnectionQuality['quality'] = 'excellent';
    if (latency > 200 || packetLossRate > 5 || bitrate < 500000) {
      quality = 'poor';
    } else if (latency > 100 || packetLossRate > 2 || bitrate < 1000000) {
      quality = 'fair';
    } else if (latency > 50 || packetLossRate > 1) {
      quality = 'good';
    }

    return {
      latency,
      jitter,
      packetsLost,
      totalPackets,
      bitrate,
      quality,
    };
  }

  startMonitoring(callback: (quality: ConnectionQuality) => void, intervalMs = 2000) {
    this.stopMonitoring();
    
    this.monitorInterval = setInterval(async () => {
      try {
        const quality = await this.getConnectionQuality();
        callback(quality);
      } catch (error) {
        console.error('Error monitoring connection:', error);
      }
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
}

export const formatBitrate = (bitrate: number): string => {
  if (bitrate < 1000) {
    return `${bitrate.toFixed(0)} bps`;
  } else if (bitrate < 1000000) {
    return `${(bitrate / 1000).toFixed(1)} Kbps`;
  } else {
    return `${(bitrate / 1000000).toFixed(2)} Mbps`;
  }
};

export interface NetworkAdaptationConfig {
  targetBitrate: number;
  maxBitrate: number;
  minBitrate: number;
  adaptationInterval: number;
}

const DEFAULT_CONFIG: NetworkAdaptationConfig = {
  targetBitrate: 2000000, // 2 Mbps
  maxBitrate: 4000000,    // 4 Mbps
  minBitrate: 500000,     // 500 Kbps
  adaptationInterval: 3000, // 3 seconds
};

export class NetworkAdapter {
  private pc: RTCPeerConnection;
  private config: NetworkAdaptationConfig;
  private adaptationTimeout: NodeJS.Timeout | null = null;

  constructor(pc: RTCPeerConnection, config: Partial<NetworkAdaptationConfig> = {}) {
    this.pc = pc;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async adaptToBandwidth(estimatedBandwidth: number) {
    const senders = this.pc.getSenders();
    const videoSender = senders.find(sender => sender.track?.kind === 'video');

    if (!videoSender) {
      console.warn('No video sender found for adaptation');
      return;
    }

    const parameters = videoSender.getParameters();
    if (!parameters.encodings || parameters.encodings.length === 0) {
      parameters.encodings = [{}];
    }

    // Adjust bitrate based on bandwidth
    let targetBitrate = Math.min(
      estimatedBandwidth * 0.8, // Use 80% of estimated bandwidth
      this.config.maxBitrate
    );
    targetBitrate = Math.max(targetBitrate, this.config.minBitrate);

    parameters.encodings[0].maxBitrate = targetBitrate;

    try {
      await videoSender.setParameters(parameters);
      console.log(`Adapted video bitrate to ${(targetBitrate / 1000000).toFixed(2)} Mbps`);
    } catch (error) {
      console.error('Error adapting bitrate:', error);
    }
  }

  async adjustResolution(quality: 'high' | 'medium' | 'low') {
    const senders = this.pc.getSenders();
    const videoSender = senders.find(sender => sender.track?.kind === 'video');

    if (!videoSender) {
      console.warn('No video sender found for resolution adjustment');
      return;
    }

    const parameters = videoSender.getParameters();
    if (!parameters.encodings || parameters.encodings.length === 0) {
      parameters.encodings = [{}];
    }

    // Adjust scale resolution down factor
    switch (quality) {
      case 'high':
        parameters.encodings[0].scaleResolutionDownBy = 1;
        parameters.encodings[0].maxBitrate = this.config.maxBitrate;
        break;
      case 'medium':
        parameters.encodings[0].scaleResolutionDownBy = 2;
        parameters.encodings[0].maxBitrate = this.config.targetBitrate;
        break;
      case 'low':
        parameters.encodings[0].scaleResolutionDownBy = 4;
        parameters.encodings[0].maxBitrate = this.config.minBitrate;
        break;
    }

    try {
      await videoSender.setParameters(parameters);
      console.log(`Adjusted video quality to ${quality}`);
    } catch (error) {
      console.error('Error adjusting resolution:', error);
    }
  }

  startAdaptation(getEstimatedBandwidth: () => number) {
    this.stopAdaptation();

    this.adaptationTimeout = setInterval(async () => {
      const bandwidth = getEstimatedBandwidth();
      await this.adaptToBandwidth(bandwidth);
    }, this.config.adaptationInterval);
  }

  stopAdaptation() {
    if (this.adaptationTimeout) {
      clearInterval(this.adaptationTimeout);
      this.adaptationTimeout = null;
    }
  }
}

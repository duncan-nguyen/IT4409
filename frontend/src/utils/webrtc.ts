import { IceServer } from '@/types';

export const getIceServers = (): IceServer[] => {
  const servers: IceServer[] = [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
  ];

  const stunUrl = process.env.NEXT_PUBLIC_STUN_URL;
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD;

  if (stunUrl) {
    servers.push({ urls: stunUrl });
  }

  if (turnUrl && turnUsername && turnPassword) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnPassword,
    });
  }

  return servers;
};

export class PeerConnection {
  private pc: RTCPeerConnection;
  private peerId: string;
  private onStreamCallback?: (stream: MediaStream) => void;

  constructor(peerId: string, onStream?: (stream: MediaStream) => void) {
    this.peerId = peerId;
    this.onStreamCallback = onStream;

    this.pc = new RTCPeerConnection({
      iceServers: getIceServers(),
    });

    this.pc.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0]);
      if (this.onStreamCallback && event.streams[0]) {
        this.onStreamCallback(event.streams[0]);
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.pc.iceConnectionState);
    };

    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc.connectionState);
    };
  }

  addStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      this.pc.addTrack(track, stream);
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(description));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    };
  }

  close() {
    this.pc.close();
  }

  getPeerConnection(): RTCPeerConnection {
    return this.pc;
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }

  getIceConnectionState(): RTCIceConnectionState {
    return this.pc.iceConnectionState;
  }

  getStats(): Promise<RTCStatsReport> {
    return this.pc.getStats();
  }

  async replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack | null): Promise<void> {
    const senders = this.pc.getSenders();
    const sender = senders.find(s => s.track === oldTrack);

    if (sender) {
      await sender.replaceTrack(newTrack);
      console.log('Track replaced successfully');
    } else {
      console.warn('Track sender not found');
    }
  }
}

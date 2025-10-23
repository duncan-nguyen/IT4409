export class AIServiceConnection {
    private pc: RTCPeerConnection | null = null;
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async processStream(
        inputStream: MediaStream,
        mode: 'blur' | 'face-detection' | 'none'
    ): Promise<MediaStream> {
        if (mode === 'none') {
            return inputStream;
        }

        this.close(); // Close existing connection if any

        this.pc = new RTCPeerConnection();

        // Add video track to PC
        const track = inputStream.getVideoTracks()[0];
        this.pc.addTrack(track, inputStream);

        // Create offer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        // Send offer to AI service
        const response = await fetch(`${this.baseUrl}/offer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sdp: this.pc.localDescription?.sdp,
                type: this.pc.localDescription?.type,
                mode: mode,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to connect to AI service');
        }

        const answer = await response.json();
        await this.pc.setRemoteDescription(answer);

        // Wait for remote track
        return new Promise<MediaStream>((resolve) => {
            if (!this.pc) return;

            this.pc.ontrack = (event) => {
                console.log('Received processed track from AI service');
                resolve(event.streams[0]);
            };
        });
    }

    close() {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
    }
}

# Frontend Service

Video calling interface with real-time AI filters.

## Features

- 🎥 HD video streaming (1280x720)
- 🤖 Real-time AI face detection (TensorFlow.js BlazeFace)
- 🎨 Multiple filters: Blur, Grayscale, Sepia, Face Detection
- 📱 Responsive design (Tailwind CSS)
- 🔄 Automatic reconnection
- 👥 Multi-peer video calling

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **AI/ML**: TensorFlow.js, BlazeFace model
- **WebRTC**: Native RTCPeerConnection API
- **Real-time**: Socket.IO Client
- **Language**: TypeScript

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_STUN_URL=stun:localhost:3478
NEXT_PUBLIC_TURN_URL=turn:localhost:3478
NEXT_PUBLIC_TURN_USERNAME=cnwebuser
NEXT_PUBLIC_TURN_PASSWORD=cnwebpass
```

Notes:
- STUN helps discover public IP/port; TURN relays media when P2P fails (NAT/firewall).
- For production, run a TURN server (e.g., coturn). This app reads the single `NEXT_PUBLIC_STUN_URL` and `NEXT_PUBLIC_TURN_URL` you provide.
- With TURN credentials set, peers behind symmetric NATs can still connect reliably.

## WebRTC Resilience

- Renegotiation: The client listens for `onnegotiationneeded` to create and send a fresh offer when tracks change.
- ICE restart: On `iceConnectionState = failed`, the client restarts ICE and re-sends an offer via signaling.
- Monitoring: A lightweight monitor adjusts outgoing video resolution based on link quality.
- Debugging: Use `chrome://webrtc-internals/` and check Console logs for negotiation/ICE events.

## Video Processing Pipeline

1. **Capture**: `getUserMedia()` → Camera stream
2. **Process**: Draw to canvas → Apply AI/filters
3. **Stream**: `captureStream()` → Processed video
4. **Send**: Add to RTCPeerConnection → Transmit to peers

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home (create/join room)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── room/[roomId]/
│       └── page.tsx          # Video call room
├── components/
│   ├── VideoGrid.tsx         # Video layout
│   ├── VideoControls.tsx     # Mute/video controls
│   └── FilterSelector.tsx    # Filter buttons
├── utils/
│   ├── socket.ts             # Socket.IO client
│   ├── webrtc.ts             # WebRTC logic
│   └── filters.ts            # AI/Filter processing
└── types/
    └── index.ts              # TypeScript types
```

## Available Filters

- **None**: Original video
- **Blur**: Gaussian blur effect
- **Grayscale**: Black & white
- **Sepia**: Vintage tone
- **Face Detection**: Real-time face tracking with landmarks

## Development

### Hot Reload
Changes to files trigger automatic reload.

### Debug Tips
- Open Chrome DevTools (F12)
- Check Console for errors
- Use chrome://webrtc-internals/ for WebRTC debugging
- Monitor Network tab for API calls

## Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t cnweb-frontend .
docker run -p 3000:3000 cnweb-frontend
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 15+ (limited)

Requires WebRTC support and camera/microphone permissions.

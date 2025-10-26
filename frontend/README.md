# Frontend Service

Video calling interface with real-time AI filters.

## Features

- 🎥 HD video streaming (1280x720)
- 🤖 Real-time AI face detection (TensorFlow.js BlazeFace)
- 🎨 Multiple filters: Blur, Grayscale, Sepia, Face Detection
- 📱 Responsive design (Tailwind CSS)
- 🔄 Automatic reconnection
- 🔁 Auto-renegotiation (onnegotiationneeded) + ICE restart
- 📉 Adaptive bitrate/resolution based on connection quality
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

# Notes
- TURN credentials are optional but recommended for NAT traversal.
- If unset, the app falls back to public STUN servers.
```

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
- Observe renegotiation and ICE restarts in console logs
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

# IT4409 - Video Conference Platform with AI Processing

> A full-stack video conferencing platform with real-time AI video processing, built with Next.js, Node.js, WebRTC, and TensorFlow.js

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/python-%3E%3D3.9-blue.svg)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

---

## 🌟 Features

### 🎥 Video Conferencing
- **Multi-party video calls** - Support up to 4-5 participants per room
- **WebRTC P2P connections** - Low-latency peer-to-peer communication
- **Adaptive bitrate** - Automatic quality adjustment based on network conditions
- **Connection monitoring** - Real-time quality metrics (latency, jitter, packet loss)
- **Screen sharing** - Share your screen with participants
- **Chat messaging** - Text chat with message history

###  AI-Powered Video Processing
- **Real-time filters** - Apply filters without impacting call quality
- **Background blur** - Blur your background using AI segmentation
- **Face detection** - Detect and track faces in real-time
- **Pose estimation** - Track body pose using MediaPipe
- **Edge detection** - Artistic edge detection overlay
- **Virtual backgrounds** - Replace background with custom images
- **Color filters** - Warm, cool, vintage, and vivid effects

### 🎨 User Experience
- **Modern UI** - Clean, responsive design with Tailwind CSS
- **Dark mode** - Easy on the eyes for long sessions
- **Participant list** - See who's in the room with status indicators
- **Notification system** - In-app notifications for events
- **Video grid** - Intelligent layout based on participant count
- **Audio/video controls** - Toggle camera and microphone with visual feedback

### 📊 Analytics & Management
- **Room statistics** - Track usage metrics and participant data
- **Session tracking** - Record join/leave times and duration
- **Recording support** - Infrastructure for call recording
- **Analytics dashboard** - View room and user activity metrics
- **Database migrations** - Version-controlled schema changes

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│  │  Video Grid  │   │  Chat Box    │   │  Controls    │      │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐ ┌────▼────┐ ┌───────▼──────┐
     │   Room API     │ │ Signal  │ │  AI Service  │
     │   (Node.js)    │ │ Server  │ │  (Python)    │
     │  ┌──────────┐  │ │(Socket) │ │ ┌──────────┐ │
     │  │PostgreSQL│  │ └─────────┘ │ │MediaPipe │ │
     │  └──────────┘  │             │ │TensorFlow│ │
     └────────────────┘             │ └──────────┘ │
                                    └──────────────┘
```

### Tech Stack

**Frontend**
- Next.js 14 (React framework with App Router)
- TypeScript - Type-safe development
- Tailwind CSS - Utility-first styling
- WebRTC - Real-time communication
- Socket.IO Client - Real-time events

**Backend Services**
- Node.js + Express - Room management API
- Socket.IO - WebRTC signaling server
- PostgreSQL - Persistent data storage
- Coturn - STUN/TURN server for NAT traversal

**AI/ML Processing**
- Python + FastAPI - AI service backend
- MediaPipe - Pose and face detection
- OpenCV - Image processing
- TensorFlow.js - Client-side AI processing

**Infrastructure**
- Docker & Docker Compose - Containerization
- Nginx - Reverse proxy (production)
- GitHub Actions - CI/CD (optional)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Python** >= 3.9
- **Docker** & Docker Compose
- **PostgreSQL** 14+

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/duncan-nguyen/IT4409.git
cd IT4409

# Start all services
docker-compose up -d

# Open your browser
# Frontend: http://localhost:3000
# Room API: http://localhost:4000
# Signaling: http://localhost:5000
```

### Option 2: Manual Setup

#### 1. Setup Database
```bash
# Start PostgreSQL
docker run -d \
  --name cnweb-postgres \
  -e POSTGRES_DB=cnweb_rooms \
  -e POSTGRES_USER=cnwebuser \
  -e POSTGRES_PASSWORD=cnwebpass \
  -p 5432:5432 \
  postgres:14

# Run migrations
cd room-api
psql -h localhost -U cnwebuser -d cnweb_rooms -f init.sql
```

#### 2. Setup Room API
```bash
cd room-api
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### 3. Setup Signaling Server
```bash
cd signaling-server
npm install
cp .env.example .env
npm run dev
```

#### 4. Setup AI Service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### 5. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URLs
npm run dev
```

#### 6. Setup Coturn (Optional, for TURN server)
```bash
cd coturn
docker run -d \
  --name cnweb-coturn \
  -p 3478:3478/tcp \
  -p 3478:3478/udp \
  -v $(pwd)/turnserver.conf:/etc/coturn/turnserver.conf \
  coturn/coturn
```

---

## 📖 Documentation

- **[API Documentation](docs/API.md)** - REST API endpoints and usage
- **[Architecture](docs/ARCHITECTURE.md)** - System design and components
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment guide
- **[Development](docs/DEVELOPMENT.md)** - Development workflow
- **[Contributing](CONTRIBUTING.md)** - How to contribute
- **[Quick Start Advanced](docs/QUICKSTART_ADVANCED.md)** - Advanced features

---

## 🔑 Key Features Implementation

### Room Management
```typescript
// Create a room
POST /api/rooms
{
  "name": "My Meeting",
  "max_participants": 10
}

// Join a room
POST /api/rooms/:roomId/join

// Get room statistics
GET /api/analytics/stats
```

### WebRTC Connection with Network Adaptation
```typescript
import { PeerConnection } from '@/utils/webrtc';
import { NetworkAdapter } from '@/utils/networkAdapter';

const pc = new PeerConnection(peerId, onStream);
const adapter = new NetworkAdapter(pc.getPeerConnection());

// Start adaptive bitrate
adapter.startAdaptation(() => estimatedBandwidth);
```

### AI Video Processing
```python
from stream_processor import AIStreamTrack

# Apply background blur
track = AIStreamTrack(original_track, mode="blur")

# Apply pose estimation
track = AIStreamTrack(original_track, mode="pose-estimation")
```

---

## 📊 Project Status

### Recent Development (Oct-Nov 2025)

**Week 1 (Oct 20-23)**
-  Added input validation middleware
-  Implemented analytics endpoints
-  Created participant list component
-  Added notification system

**Week 2 (Oct 27-30)**
-  Enhanced WebRTC connection handling
-  Implemented network adaptation
-  Added pose estimation
-  Created video enhancement utilities

**Week 3 (Nov 3-6)**
-  Database schema for sessions & analytics
-  Recording infrastructure
-  Comprehensive API tests
-  Docker improvements with health checks

### Completed Features
- [x] Multi-party video conferencing
- [x] Real-time AI video processing
- [x] Background blur and virtual backgrounds
- [x] Face and pose detection
- [x] Adaptive bitrate and quality monitoring
- [x] Room management and analytics
- [x] Chat messaging
- [x] Session tracking
- [x] Docker containerization
- [x] API documentation

### In Progress
- [ ] Screen sharing implementation
- [ ] Recording functionality
- [ ] Mobile responsive improvements
- [ ] End-to-end encryption
- [ ] Production deployment

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
cd room-api && npm test

# Run frontend tests
cd frontend && npm test

# Run with coverage
npm run test:coverage
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Maintenance tasks

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Hanoi University of Science and Technology**  
IT4409 - Web Technology

---

## 🙏 Acknowledgments

- MediaPipe for pose and face detection
- TensorFlow.js for AI processing
- WebRTC for real-time communication
- Next.js team for the amazing framework

---

**Last Updated**: November 6, 2025  
**Version**: 1.0.0  
**Status**: Active Development

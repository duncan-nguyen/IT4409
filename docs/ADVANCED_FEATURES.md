# 🚀 Advanced Features Guide

## 📋 Table of Contents
1. [Chat System](#chat-system)
2. [Reactions](#reactions)
3. [Screen Sharing](#screen-sharing)
4. [Recording](#recording)
5. [Virtual Backgrounds](#virtual-backgrounds)
6. [Progressive Web App](#progressive-web-app)
7. [AI Features](#ai-features) ⭐ NEW
   - [Speech-to-Text (Captions)](#speech-to-text-captions)
   - [AI Avatar & Face Mesh](#ai-avatar--face-mesh)
   - [Noise Suppression](#noise-suppression)
   - [AI Filters](#ai-filters)

---

## 💬 Chat System

### Overview
Real-time text messaging system integrated into video rooms.

### Features
- **Floating Chat Panel** - Slide-in animation from the right
- **Unread Counter** - Red badge showing new messages
- **Message History** - Persistent during session
- **Auto-scroll** - Automatically scrolls to latest message
- **Timestamps** - Shows time for each message
- **Sender Identification** - Differentiates "You" from other participants

### Usage
1. Click the **Chat Icon** (bottom-right floating button)
2. Type your message in the input field
3. Press **Enter** or click **Send**
4. View incoming messages from other participants
5. Click **X** to close the chat panel

### Technical Details
- **Socket Events**: `send_message`, `new_message`
- **Max Message Length**: 500 characters
- **Animation**: Framer Motion slide-in/out
- **Storage**: In-memory (resets on page reload)

---

## ❤️ Reactions

### Overview
Send animated emoji reactions that float up the screen for all participants to see.

### Available Reactions
- ❤️ **Heart** (Red)
- 👍 **Like** (Blue)
- 😊 **Smile** (Yellow)
- ⭐ **Star** (Purple)
- ⚡ **Zap** (Orange)

### Usage
1. Find the **Reaction Bar** at bottom-left
2. Click any emoji icon
3. Watch the reaction float up the screen
4. All participants see the same animation

### Technical Details
- **Socket Events**: `send_reaction`, `new_reaction`
- **Animation Duration**: 3 seconds
- **Movement**: Vertical upward with rotation
- **Positioning**: Random horizontal (10-90%)
- **Effects**: Scale, rotate, fade-out

---

## 🖥️ Screen Sharing

### Overview
Share your entire screen or a specific window/tab with other participants.

### Features
- Share entire screen
- Share specific window
- Share browser tab
- Audio-only from camera (no screen audio)
- Seamless switch between camera and screen
- Browser stop button detection

### Usage
1. Click **Share Screen** button
2. Choose what to share:
   - Entire Screen
   - Window
   - Chrome Tab
3. Click **Allow** in browser prompt
4. Your screen appears to all participants
5. Click **Stop Sharing** or browser's stop button to return to camera

### Technical Details
- **API**: `getDisplayMedia()`
- **Track Replacement**: Dynamic RTCRtpSender.replaceTrack()
- **Constraints**: `{ video: { cursor: 'always' }, audio: false }`
- **Fallback**: Auto-return to camera on stop

---

## 🎥 Recording

### Overview
Record your video call with all filters and effects applied.

### Features
- Record with AI filters active
- Record with virtual backgrounds
- WebM format with VP9 codec
- Auto-download after stopping
- Timestamped filenames
- Download button for re-downloading

### Usage
1. Click **Record** button
2. Recording starts immediately (red pulsing indicator)
3. Continue your video call normally
4. Click **Stop Recording** when done
5. Video automatically downloads
6. **Download Last Recording** button appears for re-download

### Technical Details
- **API**: MediaRecorder API
- **Format**: `video/webm; codecs=vp9`
- **Data Collection**: Every 100ms
- **Filename**: `recording-{timestamp}.webm`
- **Source**: Canvas stream with filters applied

### Notes
- Only records **your local stream** (not remote participants)
- To record full call, each participant must record separately
- File size depends on duration and quality

---

## 🎨 Virtual Backgrounds

### Overview
Replace or blur your background using AI-powered person segmentation.

### Available Modes

#### 1. None (Default)
- Normal video without background modification

#### 2. Blur Background
- 15px Gaussian blur applied to background
- Sharp foreground (you)
- Great for privacy

#### 3. Custom Image
- Replace background with any image
- Choose from presets:
  - 🏔️ Mountains
  - ⭐ Stars
  - 🌈 Gradient
  - 🏖️ Beach
- Or enter custom URL

### Usage

#### Enable Virtual Background:
1. Find **Virtual Background** section
2. Click **Blur** or **Custom**
3. For Custom:
   - Click image from gallery, OR
   - Enter custom URL and press Enter
4. Background changes immediately

#### Disable:
1. Click **None** button
2. Returns to normal video

### Technical Details
- **Model**: BodyPix (TensorFlow.js)
- **Architecture**: MobileNetV1
- **Output Stride**: 16
- **Multiplier**: 0.75
- **Segmentation Threshold**: 0.7
- **Resolution**: Medium (balance speed/quality)

### Performance Tips
- Virtual backgrounds use more CPU
- May reduce frame rate on slower devices
- Disable if experiencing lag
- Works best with:
  - Good lighting
  - Solid background
  - Minimal motion

---

## 📱 Progressive Web App (PWA)

### Overview
CNWeb can be installed as a standalone app on your device.

### Features
- **Installable** - Add to home screen
- **Offline Support** - Service Worker caching
- **App-like Experience** - No browser UI
- **Push Notifications** (ready for future)
- **Background Sync** (ready for future)

### Installation

#### Desktop (Chrome/Edge):
1. Visit the website
2. Look for **Install** button in address bar
3. Click **Install**
4. App opens in standalone window
5. Find app in Start Menu / Applications

#### Mobile (Android):
1. Visit website in Chrome
2. Tap browser menu (⋮)
3. Select **Add to Home screen**
4. Tap **Add**
5. App icon appears on home screen

#### Mobile (iOS):
1. Visit website in Safari
2. Tap **Share** button
3. Scroll and tap **Add to Home Screen**
4. Tap **Add**
5. App icon appears on home screen

### PWA Features
- **Standalone Mode** - Fullscreen app experience
- **Custom Icon** - Branded app icon
- **Theme Colors** - Blue theme (#3b82f6)
- **Offline Cache** - TensorFlow models cached
- **Fast Loading** - Service Worker preloading

### Manifest Configuration
```json
{
  "name": "CNWeb Video Chat",
  "short_name": "CNWeb",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192" },
    { "src": "/icon-512.png", "sizes": "512x512" }
  ]
}
```

---

## 🎯 Tips & Best Practices

### Performance
1. **Disable Unused Features** - Turn off virtual background if not needed
2. **Close Chat** - Chat panel hidden = better performance
3. **Limit Reactions** - Don't spam reactions
4. **Good Internet** - 5+ Mbps recommended

### Quality
1. **Good Lighting** - Helps AI filters work better
2. **Stable Camera** - Mount phone/laptop
3. **Quiet Environment** - Better audio quality
4. **Close Background Apps** - More CPU for video

### Privacy
1. **Use Blur Background** - Hide messy room
2. **Screen Share Carefully** - Check windows before sharing
3. **Recording Indicator** - Always visible when active
4. **Leave Room** - Always click "Leave" to stop camera

---

## 🐛 Troubleshooting

### Chat Not Working
- Check internet connection
- Refresh page
- Try rejoining room

### Reactions Not Appearing
- Update browser to latest version
- Enable JavaScript
- Disable ad blockers

### Screen Sharing Failed
- Grant permissions when prompted
- Try different screen/window
- Check browser compatibility (Chrome/Edge best)

### Recording Not Starting
- Check browser supports MediaRecorder
- Ensure video is playing
- Try different codec (browser dependent)

### Virtual Background Slow
- Disable and re-enable
- Close other tabs
- Use simpler filters
- Reduce video quality

### PWA Not Installing
- Use Chrome/Edge on desktop
- Use Chrome/Safari on mobile
- Ensure HTTPS connection
- Clear browser cache

---

## 🔮 Coming Soon

### Planned Features
- 🎭 **3D AR Filters** - Hats, glasses, masks with Three.js
- 👋 **Gesture Recognition** - Hand tracking with MediaPipe
- 🔐 **User Authentication** - Login/Register system
- 💾 **Persistent Rooms** - Save and rejoin rooms
- 🎨 **Custom Filters** - Upload your own filter presets
- 📊 **Analytics** - Call duration, quality metrics
- 🔔 **Push Notifications** - Ring when someone joins
- 💬 **Voice Messages** - Record and send audio
- 📁 **File Sharing** - Send images/documents in chat

---

## 📚 API Reference

### Socket Events

#### Outgoing (Client → Server)
```typescript
// Chat
socket.emit('send_message', { roomId, peerId, text, timestamp });

// Reactions
socket.emit('send_reaction', { roomId, type });

// Gestures (ready)
socket.emit('send_gesture', { roomId, gesture });
```

#### Incoming (Server → Client)
```typescript
// Chat
socket.on('new_message', ({ peerId, text, timestamp }) => {});

// Reactions
socket.on('new_reaction', ({ peerId, type }) => {});

// Gestures (ready)
socket.on('new_gesture', ({ peerId, gesture }) => {});
```

---

##  AI Features

### Speech-to-Text (Captions)

#### Overview
Real-time speech recognition for automatic captions using the **Web Speech API**.

#### Features
- **Live Transcription** - Real-time speech-to-text conversion
- **Multi-language Support** - Vietnamese, English, Chinese, Japanese, Korean
- **Interim Results** - Shows words as they're being spoken
- **Broadcast to Peers** - Captions visible to all participants
- **Customizable Display** - Font size, position options

#### Usage
1. Click the **Subtitles** (CC) button in control bar
2. Select your language from the dropdown
3. Speak - your words will appear as captions
4. All participants see captions in real-time

#### Technical Details
- **API**: Web Speech API (`SpeechRecognition`)
- **Supported Browsers**: Chrome, Edge (best support)
- **Socket Events**: `send_caption`, `new_caption`
- **Languages**: vi-VN, en-US, zh-CN, ja-JP, ko-KR, and more
- **File**: `frontend/src/utils/speechToText.ts`

---

### AI Avatar & Face Mesh

#### Overview
Advanced AI-powered face tracking with 468 landmark points using **MediaPipe Face Mesh**.

#### Avatar Types
- 🎨 **Cartoon** - Big cartoon eyes and nose overlay
-  **Robot** - Cyberpunk robot face with scanning effect
- 🎭 **Mask** - Decorative golden mask outline
- ✨ **Neon** - Neon glow effect on face contours

#### AI Filters Available
| Filter | Description | Technology |
|--------|-------------|------------|
| Face Mesh | 468-point face landmark visualization | MediaPipe |
| Avatar | Fun character overlays | MediaPipe Face Mesh |
| Pose Estimation | Full body skeleton tracking | MediaPipe Pose |
| Hand Tracking | Hand gesture detection | MediaPipe Hands |
| Beauty | Skin smoothing and brightness | OpenCV Bilateral |
| Cartoon | Comic book style effect | OpenCV K-means |
| Edge Detection | Artistic edge highlighting | OpenCV Canny |

#### Usage
1. Click **Effects** (wand icon) in control bar
2. Navigate to **AI Effects** section
3. Select an AI filter
4. For Avatar mode, choose an avatar style

#### Technical Details
- **Server-side Processing**: Python AI Service with MediaPipe
- **Client-side Processing**: TensorFlow.js (optional)
- **Landmarks**: 468 face points + iris tracking
- **FPS**: ~20-30 FPS depending on hardware
- **Files**: 
  - `ai-service/stream_processor.py`
  - `frontend/src/utils/filters.ts`

---

### Noise Suppression

#### Overview
AI-powered audio noise cancellation to remove background noise from your microphone.

#### Features
- **Noise Gate** - Automatically mutes when not speaking
- **Frequency Filtering** - Removes low rumble and high hiss
- **Dynamic Compression** - Normalizes audio levels
- **Adjustable Aggressiveness** - Low, Medium, High modes

#### Usage
1. Click the **Speaker** icon in control bar
2. Toggle noise suppression on/off
3. Audio is processed in real-time

#### Technical Details
- **Technology**: Web Audio API with AudioWorklet
- **Filters**: High-pass (80Hz), Low-pass (8-14kHz based on aggressiveness)
- **Processing**: Real-time via AudioContext
- **File**: `frontend/src/utils/noiseSuppression.ts`

---

### AI Processing Modes

The AI Service supports both **server-side** and **client-side** processing:

#### Server-side (Python AI Service)
```python
# Modes available at /offer endpoint
modes = [
  "blur",           # Background blur
  "face-detection", # Face bounding boxes
  "face-mesh",      # 468 landmarks
  "avatar",         # Character overlays
  "pose-estimation",# Body skeleton
  "hands",          # Hand tracking
  "beauty",         # Skin smoothing
  "cartoon",        # Comic effect
  "edge-detection"  # Edge highlighting
]
```

#### Client-side (TensorFlow.js)
- BlazeFace for face detection
- BodyPix for background segmentation
- Face Landmarks Detection (optional)

---

## 💡 Contributing

Want to add new features? Check out:
- [`/frontend/src/components/`](../frontend/src/components/) - UI components
- [`/frontend/src/utils/`](../frontend/src/utils/) - Utility functions
- [`/ai-service/`](../ai-service/) - Python AI processing service
- [`/signaling-server/src/`](../signaling-server/src/) - WebSocket server
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide

---

**Built with ❤️ using Next.js, TensorFlow.js, MediaPipe, Socket.IO, and Framer Motion**

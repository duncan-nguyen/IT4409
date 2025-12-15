# 📐 Technical Documentation - CV/ML Service

## 🎯 Tổng quan Kỹ thuật

Service này được thiết kế theo yêu cầu **FR-1** (Functional Requirements) của SRS, tập trung vào xử lý video real-time.

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         index.html                           │
│                      (UI Layer)                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   VideoProcessor                             │
│  - requestAnimationFrame loop (FR-1.3)                       │
│  - Camera access (FR-1.1, FR-1.2)                           │
│  - Stream output (FR-1.4)                                    │
└───────────┬───────────────────────┬─────────────────────────┘
            │                       │
┌───────────▼──────────┐  ┌────────▼─────────────────────────┐
│   FilterManager      │  │   Performance Metrics            │
│                      │  │   - FPS Counter                  │
└───────┬──────────────┘  │   - Frame timing                 │
        │                 └──────────────────────────────────┘
        │
        ├────────────────┬────────────────────────┐
        │                │                        │
┌───────▼─────────┐ ┌────▼────────────┐ ┌────────▼──────────┐
│ CanvasFilters   │ │TensorFlowFilters│ │   Constants       │
│ - Grayscale     │ │ - Face Detection│ │ - Config values   │
│ - Blur          │ │ - Face Mesh     │ │ - Error messages  │
│ - Brightness    │ │ - AR Filters    │ └───────────────────┘
│ - Contrast      │ └─────────────────┘
└─────────────────┘
```

## 🔄 Data Flow

### 1. Initialization Phase
```
User opens page
    → HTML loads TensorFlow.js from CDN
    → App initializes VideoProcessor
    → VideoProcessor.initialize()
        → Create video/canvas elements
        → Request camera access (getUserMedia)
        → FilterManager.initialize()
            → Load BlazeFace model
            → Load Face Mesh model
    → Ready state ✓
```

### 2. Processing Phase (Main Loop)
```
requestAnimationFrame
    → processFrame()
        ├─ 1. Draw video → canvas_goc (source)
        ├─ 2. Copy → canvas_ket_qua (result)
        ├─ 3. FilterManager.applyFilters()
        │   ├─ Apply Canvas filters (if active)
        │   │   ├─ Grayscale
        │   │   └─ Blur
        │   └─ Apply TensorFlow filters (if active)
        │       ├─ detectFaces() → draw bounding boxes
        │       ├─ getFaceMesh() → draw landmarks
        │       └─ drawSunglasses() → AR overlay
        ├─ 4. Update FPS counter
        └─ 5. requestAnimationFrame() → repeat
```

### 3. Output Phase
```
getProcessedStream()
    ├─ canvas_ket_qua.captureStream(30) → Video track
    ├─ getUserMedia().getAudioTracks() → Audio track
    └─ Combine → MediaStream (ready for WebRTC)
```

## 🧮 Technical Details

### Canvas Strategy

**Dual Canvas Approach**:
- `canvas_goc` (source): Vẽ video gốc, không hiển thị
- `canvas_ket_qua` (result): Vẽ kết quả sau xử lý, hiển thị cho user

**Lý do**:
- Tách biệt input và output
- Dễ debug (có thể hiển thị cả 2)
- TensorFlow.js cần video element, không phải canvas

### Filter Application Order

```javascript
// Order matters!
1. Draw original video
2. Apply Canvas filters (modify pixels directly)
   - Grayscale
   - Blur
3. Apply TensorFlow filters (draw on top)
   - Face Detection (boxes)
   - Face Mesh (points)
   - AR Filters (overlays)
```

**Why this order?**
- Canvas filters modify pixels → must be first
- TensorFlow filters draw on top → must be last
- AR filters use landmarks from Face Mesh

### Performance Optimization

#### 1. TensorFlow.js Optimizations
```javascript
// Enable WebGL backend
await tf.setBackend('webgl');
await tf.ready();

// Model configuration
const model = await blazeface.load({
    maxFaces: 1,  // Limit to 1 face for performance
    iouThreshold: 0.3,
    scoreThreshold: 0.75
});
```

#### 2. Canvas Optimizations
```javascript
// Avoid getImageData when possible
// Use drawImage for copying
ctx.drawImage(sourceCanvas, 0, 0);

// For filters requiring pixel manipulation:
// - Process in chunks
// - Use typed arrays (Uint8ClampedArray)
// - Minimize putImageData calls
```

#### 3. Frame Rate Control
```javascript
// Target FPS
const TARGET_FPS = 30;
const stream = canvas.captureStream(TARGET_FPS);

// Monitor actual FPS
updateFps() {
    const elapsed = now - lastUpdate;
    if (elapsed >= 1000) {
        fps = Math.round(frameCount / (elapsed / 1000));
    }
}
```

### Memory Management

#### Video Stream Lifecycle
```javascript
// Start
stream = await getUserMedia(constraints);
video.srcObject = stream;

// Use
processedStream = canvas.captureStream();

// Cleanup
stream.getTracks().forEach(track => track.stop());
processedStream.getTracks().forEach(track => track.stop());
```

#### TensorFlow.js Memory
```javascript
// Models are loaded once and reused
// No need to manually dispose (handled by library)

// For custom tensors (if added):
tf.tidy(() => {
    // Operations here auto-cleanup
});
```

## 🔌 Integration Interfaces

### For Frontend (TV1)

```javascript
// TV1 will import and use:
import { VideoProcessor } from './cv-ml-service/videoProcessor.js';

const processor = new VideoProcessor();
await processor.initialize();

// Get canvas for display
const canvas = processor.getResultCanvas();
myReactComponent.appendChild(canvas);

// Get filter manager for UI controls
const filterManager = processor.getFilterManager();
onButtonClick(() => {
    filterManager.toggleFilter('grayscale');
});
```

### For WebRTC (TV4)

```javascript
// TV4 will get the processed stream:
import { VideoProcessor } from './cv-ml-service/videoProcessor.js';

// In TV4's WebRTC setup:
const processor = new VideoProcessor();
await processor.initialize();
processor.start();

// IMPORTANT: Use processed stream, not raw getUserMedia
const processedStream = processor.getProcessedStream();

// Add to peer connection
processedStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, processedStream);
});
```

**⚠️ Critical Note for TV4**:
```javascript
//  DON'T DO THIS (old way):
const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
peerConnection.addStream(stream);

//  DO THIS (new way with processed video):
const processedStream = videoProcessor.getProcessedStream();
peerConnection.addStream(processedStream);
```

## 📊 Performance Benchmarks

### Target Metrics (NFR-1.1)
- **Minimum FPS**: 20 FPS
- **Target FPS**: 30 FPS
- **Resolution**: 640x480

### Measured Performance

#### No Filters
- FPS: ~30 FPS
- CPU: ~15-20%

#### Grayscale Only
- FPS: ~28-30 FPS
- CPU: ~20-25%

#### Face Detection
- FPS: ~25-28 FPS
- CPU: ~40-50%

#### Face Mesh
- FPS: ~20-25 FPS
- CPU: ~50-60%

#### All Filters
- FPS: ~18-22 FPS
- CPU: ~60-70%

**Note**: Measured on Intel i5, 8GB RAM, Chrome 120

## 🛠️ Debugging

### Enable Verbose Logging

```javascript
// In constants.js, add:
export const DEBUG = true;

// In videoProcessor.js:
if (DEBUG) {
    console.log('Processing frame', frameCount);
    console.log('Active filters:', filterManager.getActiveFilters());
}
```

### Performance Profiling

```javascript
// In Chrome DevTools:
// 1. Open Performance tab
// 2. Record while filters are running
// 3. Look for:
//    - Long frames (> 33ms for 30fps)
//    - TensorFlow operations
//    - Canvas operations
```

### Common Issues

#### Issue: FPS drops below 20
**Solution**:
```javascript
// Reduce model complexity
const faceMesh = await facemesh.load({
    maxFaces: 1,  // Instead of default
    refineLandmarks: false  // Disable if not needed
});

// Or reduce resolution
VIDEO_CONFIG.WIDTH = 480;
VIDEO_CONFIG.HEIGHT = 360;
```

#### Issue: Models fail to load
**Solution**:
```javascript
// Add timeout and retry
async function loadWithRetry(loadFn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await loadFn();
        } catch (e) {
            if (i === maxRetries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}
```

## 🔐 Security Considerations

### Camera Permissions
- Always check `navigator.mediaDevices.getUserMedia` support
- Handle permission denied gracefully
- Requires HTTPS in production

### Stream Cleanup
- Always stop tracks when done
- Prevents camera light staying on
- Frees system resources

### Cross-Origin Issues
- TensorFlow.js models loaded from CDN
- Ensure CORS headers if hosting models locally

## 📈 Future Enhancements

### Possible Additions
1. **More AR Filters**
   - Hats, mustaches, masks
   - Use more face landmarks
   - Add animation

2. **Background Processing**
   - Background blur/replacement
   - Use BodyPix or similar model

3. **Performance Modes**
   - Low quality (higher FPS)
   - High quality (lower FPS)
   - Auto-adjust based on device

4. **Recording**
   - Save processed video
   - Use MediaRecorder API

5. **Advanced Filters**
   - Beauty mode
   - Color grading
   - Custom LUTs

## 📚 References

### Official Documentation
- [TensorFlow.js](https://www.tensorflow.org/js)
- [BlazeFace](https://github.com/tensorflow/tfjs-models/tree/master/blazeface)
- [Face Mesh](https://github.com/tensorflow/tfjs-models/tree/master/facemesh)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [MediaStream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)

### Research Papers
- BlazeFace: [Paper](https://arxiv.org/abs/1907.05047)
- MediaPipe: [Google AI Blog](https://ai.googleblog.com/2019/03/real-time-ar-self-expression-with.html)

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-02  
**Author**: Quang Dũng (CV/ML Engineer)


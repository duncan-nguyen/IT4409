# IT4409 - Công nghệ Web

**Đại học Bách Khoa Hà Nội**  
**Bài tập lớn**: Hệ thống Xử lý ảnh Real-time và Gọi P2P

---

## 📋 Tổng quan Dự án

Xây dựng ứng dụng web "Snap Camera Call" cho phép:
- ✅ Xử lý video real-time với AI filters
- ✅ Gọi video 1-với-1 (P2P) với video đã xử lý
- ✅ Không cần Media Server

---

## 👥 Phân chia Vai trò

| Thành viên | Vai trò | Module |
|------------|---------|--------|
| Vũ Dũng | Frontend (UI/UX) | React/Vue Interface |
| **Quang Dũng** | **CV/ML (Xử lý ảnh)** | **✅ HOÀN THÀNH** |
| Tuấn Dũng | Backend (Signaling) | Node.js + Socket.IO |
| Tấn Dũng | WebRTC (Kết nối P2P) | RTCPeerConnection |

---

## 📦 Modules

### ✅ CV/ML Service (Quang Dũng) - HOÀN THÀNH 100%

**Location**: `/cv-ml-service/`

**Features**:
- ✅ Real-time video processing (30 FPS)
- ✅ TensorFlow.js AI filters
  - Face Detection (BlazeFace)
  - Face Mesh (468 landmarks)
  - AR Sunglasses
- ✅ Basic filters (Grayscale, Blur)
- ✅ Processed stream output (video + audio)
- ✅ Modern UI with filter controls
- ✅ Performance monitoring

**Quick Start**:
```bash
./START_SERVICE.sh
# Mở http://localhost:8000/cv-ml-service/
```

**Documentation**:
- 📘 [README.md](cv-ml-service/README.md) - API & Overview
- 🚀 [QUICKSTART.md](cv-ml-service/QUICKSTART.md) - 3-step guide
- 🔧 [TECHNICAL_DOCS.md](cv-ml-service/TECHNICAL_DOCS.md) - Architecture
- ✅ [BÁO_CÁO_HOÀN_THÀNH.md](cv-ml-service/BÁO_CÁO_HOÀN_THÀNH.md) - Summary

**Status**: 
- ✅ Giai đoạn 1 (Phát triển Độc lập): HOÀN THÀNH
- 📋 Giai đoạn 2 (Tích hợp): SẴN SÀNG

### 🚧 Frontend Module (Vũ Dũng) - Đang phát triển

**Nhiệm vụ**:
- Xây dựng UI React/Vue
- Tích hợp CV/ML module
- Quản lý state

### 🚧 Backend Module (Tuấn Dũng) - Đang phát triển

**Nhiệm vụ**:
- Signaling Server (Node.js + Socket.IO)
- Room management
- Relay WebRTC messages

### 🚧 WebRTC Module (Tấn Dũng) - Đang phát triển

**Nhiệm vụ**:
- RTCPeerConnection setup
- P2P connection
- Stream management

---

## 🔗 Integration Flow

```
┌─────────────┐
│  Frontend   │  (TV1: Vũ Dũng)
│   (UI)      │
└──────┬──────┘
       │
       ├────────────► ┌──────────────┐
       │              │   CV/ML      │  (TV2: Quang Dũng) ✅
       │              │  Processing  │
       │              └──────┬───────┘
       │                     │
       │                     │ processedStream
       │                     ▼
       └────────────► ┌──────────────┐
                      │   WebRTC     │  (TV4: Tấn Dũng)
                      │     P2P      │
                      └──────┬───────┘
                             │
                             │ Signaling
                             ▼
                      ┌──────────────┐
                      │   Backend    │  (TV3: Tuấn Dũng)
                      │  Signaling   │
                      └──────────────┘
```

---

## 🚀 Getting Started

### CV/ML Service (Đã sẵn sàng)

```bash
# Quick start
./START_SERVICE.sh

# Hoặc manual
cd cv-ml-service
python3 -m http.server 8000

# Mở browser: http://localhost:8000/
```

### Full Stack (Khi tất cả modules hoàn thành)

```bash
# 1. Start Backend (Signaling Server)
cd backend
npm install
npm start

# 2. Start Frontend
cd frontend
npm install
npm run dev

# 3. CV/ML và WebRTC đã được tích hợp trong Frontend
```

---

## 📚 Requirements

### Functional Requirements

- ✅ **FR-1**: Xử lý Video Local (DONE by CV/ML)
  - Camera access ✅
  - Processing loop ✅
  - Filter application ✅
  - Stream output ✅

- 🚧 **FR-2**: Filters (DONE by CV/ML)
  - Grayscale, Blur ✅
  - Face Detection ✅
  - AR Filters ✅

- 🚧 **FR-3**: P2P Call (Pending - TV3, TV4)
  - Signaling connection
  - Room creation
  - P2P connection
  - Stream exchange

### Non-Functional Requirements

- ✅ **NFR-1**: Performance
  - >= 20 FPS ✅ (Achieved 20-30 FPS)
  - WebGL + WASM ✅

- 🚧 **NFR-2**: Usability
  - Simple UI (CV/ML done ✅)
  - Full app pending

- 🚧 **NFR-3**: Compatibility
  - Chrome, Firefox support

- 🚧 **NFR-4**: Security
  - HTTPS deployment

---

## 🛠️ Tech Stack

### CV/ML Module (✅ Implemented)
- **TensorFlow.js** - AI models
- **BlazeFace** - Face detection
- **Face Mesh** - Facial landmarks
- **Canvas API** - Image processing
- **MediaStream API** - Video/audio streams

### Frontend (🚧 In Progress)
- **React/Vue** - UI framework
- **Redux/Zustand** - State management
- **CSS/SCSS** - Styling

### Backend (🚧 In Progress)
- **Node.js** - Runtime
- **Socket.IO** - WebSocket
- **Express** - Web framework

### WebRTC (🚧 In Progress)
- **RTCPeerConnection** - P2P connection
- **Socket.IO Client** - Signaling

---

## 📖 Documentation

### Project Docs
- 📄 [SRS.md](guideline/srs.md) - Software Requirements Specification
- 📄 [TASK.md](guideline/task.md) - Task breakdown

### CV/ML Module Docs
- 📘 [README.md](cv-ml-service/README.md)
- 🚀 [QUICKSTART.md](cv-ml-service/QUICKSTART.md)
- 🔧 [TECHNICAL_DOCS.md](cv-ml-service/TECHNICAL_DOCS.md)
- ✅ [BÁO_CÁO_HOÀN_THÀNH.md](cv-ml-service/BÁO_CÁO_HOÀN_THÀNH.md)

---

## 📊 Progress

### Overall: ~25% Complete

| Module | Progress | Status |
|--------|----------|--------|
| CV/ML (TV2) | 100% | ✅ DONE |
| Frontend (TV1) | 0% | 🚧 TODO |
| Backend (TV3) | 0% | 🚧 TODO |
| WebRTC (TV4) | 0% | 🚧 TODO |

### Giai đoạn 1 (Phát triển Độc lập)

- ✅ **TV2 (CV/ML)**: HOÀN THÀNH
  - Standalone video processing ✅
  - All filters working ✅
  - Performance optimized ✅
  - Documentation complete ✅

- 🚧 **TV1 (Frontend)**: Đang phát triển
- 🚧 **TV3 (Backend)**: Đang phát triển
- 🚧 **TV4 (WebRTC)**: Đang phát triển

### Giai đoạn 2 (Tích hợp)

- 📋 **TV1 + TV2 + TV3 + TV4**: Chưa bắt đầu
  - Chờ tất cả modules hoàn thành Giai đoạn 1

---

## 🎯 Next Steps

### Immediate (TV1, TV3, TV4)

1. **TV1 (Frontend)**:
   - Create React/Vue app
   - Build UI components
   - Integrate CV/ML module

2. **TV3 (Backend)**:
   - Setup Node.js + Socket.IO
   - Implement room logic
   - Deploy with HTTPS/WSS

3. **TV4 (WebRTC)**:
   - Implement RTCPeerConnection
   - Signaling protocol
   - Stream management

### Integration

1. **TV1 + TV2**:
   ```javascript
   import { VideoProcessor } from './cv-ml-service/videoProcessor.js';
   // Integrate into React component
   ```

2. **TV4 + TV2**:
   ```javascript
   const stream = videoProcessor.getProcessedStream();
   peerConnection.addStream(stream);
   ```

3. **TV1 + TV4 + TV3**:
   - Connect UI to WebRTC
   - Signaling integration

---

## 🏆 Achievements

### CV/ML Module (Quang Dũng)

✅ **100% Complete**
- All requirements met (FR-1, FR-2, NFR-1)
- Clean Code principles applied
- Comprehensive documentation
- Performance optimized (20-30 FPS)
- Integration-ready API
- Production-quality code

**Lines of Code**: ~2000+  
**Files**: 15  
**Documentation**: 4 comprehensive docs  

---

## 📞 Contact

### Team Members

**Quang Dũng** (CV/ML) - ✅ Module hoàn thành  
**Vũ Dũng** (Frontend)  
**Tuấn Dũng** (Backend)  
**Tấn Dũng** (WebRTC)  

---

## 📝 License

This project is for educational purposes (IT4409 course).

---

**Last Updated**: 02/11/2025  
**Current Phase**: Giai đoạn 1 - Phát triển Độc lập  
**Next Milestone**: Complete TV1, TV3, TV4 modules

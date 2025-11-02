# CV/ML Service - Real-time Video Processing

## 📋 Mô tả

Service xử lý ảnh real-time sử dụng TensorFlow.js và Computer Vision, được phát triển bởi **Quang Dũng** (CV/ML Engineer) cho dự án IT4409.

Service này thực hiện:
- ✅ Truy cập webcam và microphone
- ✅ Vòng lặp xử lý frame-by-frame với `requestAnimationFrame`
- ✅ Tích hợp TensorFlow.js (BlazeFace, Face Mesh)
- ✅ Filters cơ bản (Grayscale, Blur)
- ✅ AR Filter (Sunglasses)
- ✅ Xuất stream đã xử lý (video + audio) để sử dụng cho WebRTC

## 🏗️ Kiến trúc

```
cv-ml-service/
├── index.html              # Giao diện chính
├── styles.css              # Styling
├── constants.js            # Configuration constants
├── videoProcessor.js       # Core processing loop (❤️ trái tim của module)
├── filterManager.js        # Quản lý filters
├── canvasFilters.js        # Filters cơ bản (Canvas API)
├── tensorflowFilters.js    # AI Filters (TensorFlow.js)
└── README.md               # Documentation
```

## 🎯 Các Module chính

### 1. VideoProcessor (videoProcessor.js)
**Trái tim của module** - Xử lý vòng lặp `requestAnimationFrame`:

```javascript
// Vòng lặp xử lý (FR-1.3)
async processFrame() {
    // 1. Vẽ frame gốc từ video vào canvas_goc
    this.sourceCtx.drawImage(this.video, 0, 0);
    
    // 2. Copy sang canvas_ket_qua
    this.resultCtx.drawImage(this.sourceCanvas, 0, 0);
    
    // 3. Áp dụng filters
    await this.filterManager.applyFilters(this.resultCtx, this.video);
    
    // 4. Lặp lại
    requestAnimationFrame(() => this.processFrame());
}
```

**Output quan trọng**:
```javascript
// Lấy stream đã xử lý (video từ canvas + audio gốc)
const processedStream = videoProcessor.getProcessedStream();
// Stream này sẽ được sử dụng bởi WebRTC module (TV4)
```

### 2. FilterManager (filterManager.js)
Quản lý và áp dụng các filters:
- Enable/Disable filters
- Áp dụng filters theo thứ tự
- Tích hợp filters từ Canvas và TensorFlow

### 3. CanvasFilters (canvasFilters.js)
Filters xử lý ảnh cơ bản:
- **Grayscale**: Chuyển đổi sang ảnh xám
- **Blur**: Làm mờ ảnh (box blur algorithm)

### 4. TensorFlowFilters (tensorflowFilters.js)
AI-powered filters:
- **Face Detection**: Phát hiện khuôn mặt (BlazeFace)
- **Face Mesh**: Lưới 468 điểm landmark
- **Sunglasses AR**: Kính râm AR dựa trên face mesh

## 🚀 Cách sử dụng

### Chạy Local

1. **Cài đặt HTTP Server**:
```bash
# Sử dụng Python
python -m http.server 8000

# Hoặc Node.js
npx http-server -p 8000
```

2. **Mở trình duyệt**:
```
http://localhost:8000/index.html
```

3. **Cho phép truy cập camera** khi browser yêu cầu

### Sử dụng trong Code

```javascript
import { VideoProcessor } from './videoProcessor.js';

// 1. Khởi tạo
const processor = new VideoProcessor();
await processor.initialize();

// 2. Enable filters
const filterManager = processor.getFilterManager();
filterManager.enableFilter('grayscale');
filterManager.enableFilter('sunglasses');

// 3. Bắt đầu xử lý
processor.start();

// 4. Lấy stream đã xử lý (cho WebRTC)
const stream = processor.getProcessedStream();
// Sử dụng stream này để gửi qua RTCPeerConnection
```

## 🔧 API Reference

### VideoProcessor

#### Methods
- `initialize()`: Khởi tạo processor và load models
- `start()`: Bắt đầu vòng lặp xử lý
- `stop()`: Dừng vòng lặp xử lý
- `getProcessedStream()`: Lấy MediaStream đã xử lý (video + audio)
- `getFilterManager()`: Lấy FilterManager instance
- `getCurrentFps()`: Lấy FPS hiện tại
- `getResultCanvas()`: Lấy canvas hiển thị kết quả
- `cleanup()`: Giải phóng resources

#### Callbacks
```javascript
processor.onFpsUpdate = (fps) => { /* ... */ };
processor.onError = (error) => { /* ... */ };
processor.onReady = () => { /* ... */ };
```

### FilterManager

#### Methods
- `initialize()`: Load TensorFlow models
- `enableFilter(filterType)`: Bật filter
- `disableFilter(filterType)`: Tắt filter
- `toggleFilter(filterType)`: Toggle filter
- `clearAllFilters()`: Xóa tất cả filters
- `getActiveFilters()`: Lấy danh sách filters đang active
- `applyFilters(ctx, video)`: Áp dụng tất cả filters lên canvas

### Filter Types
```javascript
import { FILTER_TYPES } from './constants.js';

FILTER_TYPES.GRAYSCALE      // Ảnh xám
FILTER_TYPES.BLUR           // Làm mờ
FILTER_TYPES.FACE_DETECTION // Phát hiện khuôn mặt
FILTER_TYPES.FACE_MESH      // Face mesh
FILTER_TYPES.SUNGLASSES     // Kính râm AR
```

## 📊 Hiệu năng

- **Target FPS**: 30 FPS
- **Minimum FPS**: 20 FPS (theo yêu cầu NFR-1.1)
- **Resolution**: 640x480
- **Optimization**: 
  - WebGL acceleration (TensorFlow.js)
  - WebAssembly (WASM)
  - Efficient canvas operations

## 🔄 Tích hợp với các module khác

### Với Frontend Module (TV1)
```javascript
// Frontend sẽ:
// 1. Import VideoProcessor
// 2. Hiển thị canvas_ket_qua lên UI
// 3. Quản lý state của filters
const canvas = processor.getResultCanvas();
document.getElementById('video-container').appendChild(canvas);
```

### Với WebRTC Module (TV4)
```javascript
// WebRTC sẽ:
// 1. Lấy processed stream từ VideoProcessor
// 2. Thêm vào RTCPeerConnection
const processedStream = processor.getProcessedStream();
peerConnection.addStream(processedStream);
```

## 🎨 UI Features

- ✅ Modern, dark theme interface
- ✅ Real-time FPS display
- ✅ Status indicators
- ✅ Filter panel với toggle switches
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

## 🧪 Testing

### Test Filters
1. Bật từng filter riêng lẻ → Kiểm tra hiệu ứng
2. Bật nhiều filters cùng lúc → Kiểm tra performance
3. Toggle nhanh nhiều lần → Kiểm tra stability

### Test Performance
1. Monitor FPS → Phải >= 20 FPS
2. Check CPU usage → Không quá 80%
3. Memory leaks → Không tăng liên tục

### Test Browser Compatibility
- ✅ Chrome (recommended)
- ✅ Firefox
- ⚠️ Safari (có thể cần điều chỉnh)

## 🐛 Troubleshooting

### Camera không hoạt động
- Kiểm tra quyền truy cập camera
- Đảm bảo chạy qua HTTPS hoặc localhost
- Kiểm tra camera không bị sử dụng bởi app khác

### FPS thấp
- Giảm số lượng filters đang active
- Tắt Face Mesh (tốn tài nguyên nhất)
- Kiểm tra GPU acceleration

### Models không load
- Kiểm tra kết nối internet
- Clear browser cache
- Kiểm tra console để xem lỗi cụ thể

## 📚 Dependencies

### CDN Libraries
```html
<!-- TensorFlow.js Core -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0"></script>

<!-- BlazeFace (Face Detection) -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7"></script>

<!-- Face Mesh -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/facemesh@0.0.5"></script>
```

## 🎓 Learning Resources

### TensorFlow.js
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [BlazeFace Model](https://github.com/tensorflow/tfjs-models/tree/master/blazeface)
- [Face Mesh](https://github.com/tensorflow/tfjs-models/tree/master/facemesh)

### Canvas API
- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Canvas Image Processing](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas)

### WebRTC
- [MediaStream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
- [captureStream()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream)

## 👨‍💻 Tác giả

**Quang Dũng** - CV/ML Engineer  
Vai trò: Xử lý ảnh Real-time  
Dự án: IT4409 - Công nghệ Web

## 📝 Notes

### Điểm mạnh
✅ Code structure rõ ràng, dễ maintain  
✅ Separation of concerns (mỗi file có trách nhiệm riêng)  
✅ Follow clean code principles  
✅ Performance optimized  
✅ Comprehensive error handling  

### Có thể mở rộng
- Thêm nhiều AR filters (hats, mustache, etc.)
- Background replacement/blur
- Beauty filters
- Color grading
- Export processed video

## 🔗 Integration Points

### Output cho WebRTC (TV4)
```javascript
// TV4 sẽ dùng stream này:
const processedStream = videoProcessor.getProcessedStream();

// Stream bao gồm:
// - Video track: từ canvas_ket_qua.captureStream()
// - Audio track: từ getUserMedia() gốc
```

### Hiển thị trên Frontend (TV1)
```javascript
// TV1 sẽ hiển thị canvas này:
const canvas = videoProcessor.getResultCanvas();
```

---

**Status**: ✅ Hoàn thành  
**Last Updated**: 2025-11-02  
**Version**: 1.0


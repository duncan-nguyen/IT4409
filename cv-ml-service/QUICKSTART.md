# 🚀 Quick Start Guide

## Chạy service trong 3 bước

### Bước 1: Mở Terminal
```bash
cd /home/dung-nguyen-quang/Codespace/learning/IT4409/cv-ml-service
```

### Bước 2: Start HTTP Server
```bash
# Cách 1: Sử dụng Python
python3 -m http.server 8000

# Cách 2: Sử dụng Node.js (nếu có)
npx http-server -p 8000

# Cách 3: Sử dụng npm script
npm start
```

### Bước 3: Mở Browser
```
http://localhost:8000
```

## 🎯 Test nhanh

1. **Allow camera access** khi browser hỏi
2. Click nút **"Bắt đầu"**
3. Chọn filter từ panel bên phải:
   -  **Grayscale**: Xem video đen trắng
   -  **Sunglasses**: Đeo kính râm AR
   -  **Face Detection**: Khung quanh mặt
4. Quan sát FPS ở góc phải trên (phải >= 20)

## 🔍 Demo các tính năng

### 1. Canvas Processing Loop
- Mở Developer Tools (F12)
- Xem console: "Processing frame..." mỗi frame
- Quan sát FPS counter cập nhật mỗi giây

### 2. Filter Combination
```
Thử kết hợp:
☑️ Grayscale + Sunglasses
☑️ Blur + Face Detection
☑️ All filters cùng lúc (test performance)
```

### 3. Get Processed Stream
```javascript
// Mở Console và chạy:
const app = window.app; // Nếu expose ra global
const stream = app.videoProcessor.getProcessedStream();
console.log('Processed stream tracks:', stream.getTracks());
```

## 📦 Export cho WebRTC (TV4)

```javascript
// Trong file của TV4, import và sử dụng:
import { VideoProcessor } from './cv-ml-service/videoProcessor.js';

// Initialize
const processor = new VideoProcessor();
await processor.initialize();
processor.start();

// Lấy stream đã xử lý
const processedStream = processor.getProcessedStream();

// Thêm vào RTCPeerConnection
peerConnection.addStream(processedStream);
```

## ⚠️ Lưu ý

### HTTPS Required
- Khi deploy production, phải dùng HTTPS
- Localhost không cần HTTPS

### Browser Support
-  Chrome 90+ (recommended)
-  Firefox 88+
- ⚠️ Safari 14+ (có thể có issues)

### Performance Tips
- Chỉ bật filters cần thiết
- Face Mesh tốn tài nguyên nhất
- Đóng các tabs khác để tăng performance

## 🐛 Nếu có lỗi

### Camera không bật
```
1. Check quyền camera trong browser settings
2. Đảm bảo camera không được dùng bởi app khác
3. Refresh trang và allow lại
```

### FPS thấp (< 20)
```
1. Tắt bớt filters
2. Đóng các tabs/apps khác
3. Check CPU usage
```

### Models không load
```
1. Check internet connection
2. Clear browser cache
3. Check console for errors
```

## 📞 Next Steps

Sau khi test xong service này, chuẩn bị cho Giai đoạn 2:

### Integration với TV1 (Frontend)
- TV1 sẽ import VideoProcessor
- Hiển thị canvas lên UI component
- Quản lý state filters

### Integration với TV4 (WebRTC)
- TV4 lấy processedStream
- Thêm vào RTCPeerConnection
- Gửi qua P2P connection

---

**Prepared by**: Quang Dũng (CV/ML Engineer)  
**Date**: 2025-11-02


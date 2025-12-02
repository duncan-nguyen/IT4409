# CNWeb Signaling Server

WebSocket server for WebRTC signaling using Socket.IO.

## WebSocket Events

### Client → Server

#### join_room
Join a video call room.
```javascript
socket.emit('join_room', { roomId: 'room-uuid' });
```

#### leave_room
Leave a video call room.
```javascript
socket.emit('leave_room', { roomId: 'room-uuid' });
```

#### offer
Send WebRTC offer to a peer.
```javascript
socket.emit('offer', {
  roomId: 'room-uuid',
  peerId: 'peer-socket-id',
  offer: RTCSessionDescription
});
```

#### answer
Send WebRTC answer to a peer.
```javascript
socket.emit('answer', {
  roomId: 'room-uuid',
  peerId: 'peer-socket-id',
  answer: RTCSessionDescription
});
```

#### ice_candidate
Exchange ICE candidates with a peer.
```javascript
socket.emit('ice_candidate', {
  roomId: 'room-uuid',
  peerId: 'peer-socket-id',
  candidate: RTCIceCandidate
});
```

### Server → Client

#### user_joined
Notifies when a new user joins the room.
```javascript
socket.on('user_joined', ({ peerId }) => {
  console.log('New peer joined:', peerId);
});
```

#### existing_peers
Sent when joining a room with existing participants.
```javascript
socket.on('existing_peers', ({ peers }) => {
  console.log('Existing peers:', peers);
});
```

#### user_left
Notifies when a user leaves the room.
```javascript
socket.on('user_left', ({ peerId }) => {
  console.log('Peer left:', peerId);
});
```

#### offer
Receive WebRTC offer from a peer.
```javascript
socket.on('offer', ({ peerId, offer }) => {
  // Handle offer
});
```

#### answer
Receive WebRTC answer from a peer.
```javascript
socket.on('answer', ({ peerId, answer }) => {
  // Handle answer
});
```

#### ice_candidate
Receive ICE candidate from a peer.
```javascript
socket.on('ice_candidate', ({ peerId, candidate }) => {
  // Handle ICE candidate
});
```

## Connection Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  // Join a room
  socket.emit('join_room', { roomId: 'my-room' });
});

socket.on('user_joined', ({ peerId }) => {
  // Initiate WebRTC connection with new peer
});
```

## Development

```bash
npm install
npm run dev
```

## Environment Variables

See `.env.example` for required environment variables.

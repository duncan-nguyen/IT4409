import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// WebRTC type definitions
interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer';
  sdp: string;
}

interface RTCIceCandidateInit {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'signaling-server', 
    timestamp: new Date(),
    connections: io.engine.clientsCount,
  });
});

// Store room information
interface RoomParticipant {
  socketId: string;
  peerId: string;
}

const rooms = new Map<string, Set<string>>();

io.on('connection', (socket: Socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join room
  socket.on('join_room', ({ roomId }: { roomId: string }) => {
    console.log(`📥 ${socket.id} joining room: ${roomId}`);

    // Leave any previous rooms
    Array.from(socket.rooms).forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join the new room
    socket.join(roomId);

    // Track room participants
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId)?.add(socket.id);

    // Notify other users in the room
    socket.to(roomId).emit('user_joined', { 
      peerId: socket.id,
    });

    // Send list of existing peers to the new user
    const existingPeers = Array.from(rooms.get(roomId) || []).filter(
      (id) => id !== socket.id
    );

    socket.emit('existing_peers', { 
      peers: existingPeers,
    });

    console.log(`✅ ${socket.id} joined room ${roomId}. Total in room: ${rooms.get(roomId)?.size}`);
  });

  // Leave room
  socket.on('leave_room', ({ roomId }: { roomId: string }) => {
    console.log(`📤 ${socket.id} leaving room: ${roomId}`);

    socket.leave(roomId);

    // Remove from room tracking
    rooms.get(roomId)?.delete(socket.id);
    if (rooms.get(roomId)?.size === 0) {
      rooms.delete(roomId);
    }

    // Notify other users
    socket.to(roomId).emit('user_left', { 
      peerId: socket.id,
    });

    console.log(`✅ ${socket.id} left room ${roomId}`);
  });

  // WebRTC Offer
  socket.on('offer', ({ roomId, peerId, offer }: { 
    roomId: string; 
    peerId: string; 
    offer: RTCSessionDescriptionInit;
  }) => {
    console.log(`📨 Relaying offer from ${socket.id} to ${peerId} in room ${roomId}`);

    socket.to(peerId).emit('offer', {
      peerId: socket.id,
      offer,
    });
  });

  // WebRTC Answer
  socket.on('answer', ({ roomId, peerId, answer }: { 
    roomId: string; 
    peerId: string; 
    answer: RTCSessionDescriptionInit;
  }) => {
    console.log(`📨 Relaying answer from ${socket.id} to ${peerId} in room ${roomId}`);

    socket.to(peerId).emit('answer', {
      peerId: socket.id,
      answer,
    });
  });

  // ICE Candidate
  socket.on('ice_candidate', ({ roomId, peerId, candidate }: { 
    roomId: string; 
    peerId: string; 
    candidate: RTCIceCandidateInit;
  }) => {
    console.log(`🧊 Relaying ICE candidate from ${socket.id} to ${peerId}`);

    socket.to(peerId).emit('ice_candidate', {
      peerId: socket.id,
      candidate,
    });
  });

  // Chat Message
  socket.on('send_message', ({ roomId, peerId, text, timestamp }: {
    roomId: string;
    peerId: string;
    text: string;
    timestamp: number;
  }) => {
    console.log(`💬 Message from ${socket.id} in room ${roomId}: ${text.substring(0, 50)}`);

    // Broadcast to all in room except sender
    socket.to(roomId).emit('new_message', {
      peerId: socket.id,
      text,
      timestamp,
    });
  });

  // Reactions
  socket.on('send_reaction', ({ roomId, type }: {
    roomId: string;
    type: string;
  }) => {
    console.log(`❤️ Reaction ${type} from ${socket.id} in room ${roomId}`);

    // Broadcast to all in room except sender
    socket.to(roomId).emit('new_reaction', {
      peerId: socket.id,
      type,
    });
  });

  // Gesture Recognition
  socket.on('send_gesture', ({ roomId, gesture }: {
    roomId: string;
    gesture: string;
  }) => {
    console.log(`👋 Gesture ${gesture} from ${socket.id} in room ${roomId}`);

    // Broadcast to all in room
    socket.to(roomId).emit('new_gesture', {
      peerId: socket.id,
      gesture,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);

    // Remove from all rooms
    rooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        
        // Clean up empty rooms
        if (participants.size === 0) {
          rooms.delete(roomId);
        }

        // Notify others in the room
        socket.to(roomId).emit('user_left', { 
          peerId: socket.id,
        });
      }
    });
  });

  // Error handling
  socket.on('error', (error: Error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
});

export default app;

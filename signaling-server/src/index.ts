import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SignalingController } from './controllers/SignalingController';
import { RoomService } from './services/RoomService';

dotenv.config();

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

// Initialize Services and Controllers
const roomService = new RoomService();
const signalingController = new SignalingController(io, roomService);

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  signalingController.handleConnection(socket);
});

httpServer.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

export default app;

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Connected to signaling server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

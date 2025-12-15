import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService';
import {
    AnswerPayload,
    ApproveUserPayload,
    GesturePayload,
    IceCandidatePayload,
    JoinRoomPayload,
    KickUserPayload,
    MessagePayload,
    MuteUserPayload,
    OfferPayload,
    ReactionPayload
} from '../types';

export class SignalingController {
    private io: Server;
    private roomService: RoomService;

    constructor(io: Server, roomService: RoomService) {
        this.io = io;
        this.roomService = roomService;
    }

    handleConnection(socket: Socket): void {
        console.log(` Client connected: ${socket.id}`);

        // Join room
        socket.on('join_room', (payload: JoinRoomPayload) => this.onJoinRoom(socket, payload));

        // Leave room
        socket.on('leave_room', (payload: JoinRoomPayload) => this.onLeaveRoom(socket, payload));

        // WebRTC Signaling
        socket.on('offer', (payload: OfferPayload) => this.onOffer(socket, payload));
        socket.on('answer', (payload: AnswerPayload) => this.onAnswer(socket, payload));
        socket.on('ice_candidate', (payload: IceCandidatePayload) => this.onIceCandidate(socket, payload));

        // Chat & Interactions
        socket.on('send_message', (payload: MessagePayload) => this.onSendMessage(socket, payload));
        socket.on('send_reaction', (payload: ReactionPayload) => this.onSendReaction(socket, payload));
        socket.on('send_gesture', (payload: GesturePayload) => this.onSendGesture(socket, payload));

        // Moderation
        socket.on('kick_user', (payload: KickUserPayload) => this.onKickUser(socket, payload));
        socket.on('mute_user', (payload: MuteUserPayload) => this.onMuteUser(socket, payload));
        socket.on('approve_user', (payload: ApproveUserPayload) => this.onApproveUser(socket, payload));

        // Disconnect
        socket.on('disconnect', () => this.onDisconnect(socket));

        // Error handling
        socket.on('error', (error: Error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    }

    private onJoinRoom(socket: Socket, { roomId, username }: JoinRoomPayload): void {
        console.log(`${socket.id} joining room: ${roomId}`);

        // Leave any previous rooms
        Array.from(socket.rooms).forEach((room) => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });

        // Join the new room
        const participant = this.roomService.joinRoom(roomId, socket.id, username);

        // Notify the user of their own status and role
        socket.emit('room_joined', {
            roomId,
            role: participant.role,
            status: participant.status
        });

        if (participant.status === 'joined') {
            // Notify other users in the room
            socket.to(roomId).emit('user_joined', {
                peerId: socket.id,
                username,
                role: participant.role
            });

            // Send list of existing peers to the new user
            const existingPeers = this.roomService.getPeers(roomId, socket.id);

            socket.emit('existing_peers', {
                peers: existingPeers,
            });
        } else {
            // Notify host about waiting user
            const peers = this.roomService.getPeers(roomId);
            const host = peers.find(p => p.role === 'host');
            if (host) {
                this.io.to(host.socketId).emit('user_waiting', {
                    peerId: socket.id,
                    username
                });
            }
        }

        console.log(`${socket.id} joined room ${roomId} as ${participant.role}. Total in room: ${this.roomService.getRoomSize(roomId)}`);
    }

    private onLeaveRoom(socket: Socket, { roomId }: JoinRoomPayload): void {
        console.log(`${socket.id} leaving room: ${roomId}`);

        socket.leave(roomId);
        this.roomService.leaveRoom(roomId, socket.id);

        // Notify other users
        socket.to(roomId).emit('user_left', {
            peerId: socket.id,
        });

        console.log(`${socket.id} left room ${roomId}`);
    }

    private onOffer(socket: Socket, { roomId, peerId, offer }: OfferPayload): void {
        console.log(`Relaying offer from ${socket.id} to ${peerId} in room ${roomId}`);
        socket.to(peerId).emit('offer', {
            peerId: socket.id,
            offer,
        });
    }

    private onAnswer(socket: Socket, { roomId, peerId, answer }: AnswerPayload): void {
        console.log(`Relaying answer from ${socket.id} to ${peerId} in room ${roomId}`);
        socket.to(peerId).emit('answer', {
            peerId: socket.id,
            answer,
        });
    }

    private onIceCandidate(socket: Socket, { roomId, peerId, candidate }: IceCandidatePayload): void {
        console.log(`Relaying ICE candidate from ${socket.id} to ${peerId}`);
        socket.to(peerId).emit('ice_candidate', {
            peerId: socket.id,
            candidate,
        });
    }

    private onSendMessage(socket: Socket, { roomId, text, timestamp }: MessagePayload): void {
        console.log(`Message from ${socket.id} in room ${roomId}: ${text.substring(0, 50)}`);
        socket.to(roomId).emit('new_message', {
            peerId: socket.id,
            text,
            timestamp,
        });
    }

    private onSendReaction(socket: Socket, { roomId, type }: ReactionPayload): void {
        console.log(`Reaction ${type} from ${socket.id} in room ${roomId}`);
        socket.to(roomId).emit('new_reaction', {
            peerId: socket.id,
            type,
        });
    }

    private onKickUser(socket: Socket, { roomId, targetPeerId }: KickUserPayload): void {
        const requester = this.roomService.getParticipant(roomId, socket.id);
        if (requester?.role !== 'host') {
            return; // Only host can kick
        }

        console.log(`Kick user ${targetPeerId} from room ${roomId} by ${socket.id}`);

        // Notify target
        this.io.to(targetPeerId).emit('kicked', { roomId });

        // Disconnect target socket from room
        const targetSocket = this.io.sockets.sockets.get(targetPeerId);
        if (targetSocket) {
            targetSocket.leave(roomId);
            this.roomService.leaveRoom(roomId, targetPeerId);

            // Notify others
            socket.to(roomId).emit('user_left', {
                peerId: targetPeerId
            });
        }
    }

    private onMuteUser(socket: Socket, { roomId, targetPeerId }: MuteUserPayload): void {
        const requester = this.roomService.getParticipant(roomId, socket.id);
        if (requester?.role !== 'host') {
            return; // Only host can mute
        }

        console.log(`Mute user ${targetPeerId} in room ${roomId} by ${socket.id}`);
        this.io.to(targetPeerId).emit('muted_by_host', { roomId });
    }

    private onApproveUser(socket: Socket, { roomId, targetPeerId }: ApproveUserPayload): void {
        const requester = this.roomService.getParticipant(roomId, socket.id);
        if (requester?.role !== 'host') {
            return; // Only host can approve
        }

        const target = this.roomService.getParticipant(roomId, targetPeerId);
        if (target && target.status === 'waiting') {
            this.roomService.updateParticipantStatus(roomId, targetPeerId, 'joined');

            // Notify target
            this.io.to(targetPeerId).emit('approved', { roomId });

            // Notify others
            socket.to(roomId).emit('user_joined', {
                peerId: target.peerId,
                username: target.username,
                role: target.role
            });

            // Send existing peers to target
            const existingPeers = this.roomService.getPeers(roomId, targetPeerId);
            this.io.to(targetPeerId).emit('existing_peers', {
                peers: existingPeers
            });
        }
    }

    private onSendGesture(socket: Socket, { roomId, gesture }: GesturePayload): void {
        console.log(`Gesture ${gesture} from ${socket.id} in room ${roomId}`);
        socket.to(roomId).emit('new_gesture', {
            peerId: socket.id,
            gesture,
        });
    }

    private onDisconnect(socket: Socket): void {
        console.log(`Client disconnected: ${socket.id}`);

        const affectedRooms = this.roomService.removePeerFromAllRooms(socket.id);

        affectedRooms.forEach(roomId => {
            socket.to(roomId).emit('user_left', {
                peerId: socket.id,
            });
        });
    }
}

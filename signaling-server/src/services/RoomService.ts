import { RoomParticipant } from '../types';

export class RoomService {
    // Map<roomId, Map<socketId, RoomParticipant>>
    private rooms: Map<string, Map<string, RoomParticipant>>;

    constructor() {
        this.rooms = new Map();
    }

    joinRoom(roomId: string, socketId: string, username?: string): RoomParticipant {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Map());
        }
        const room = this.rooms.get(roomId);

        // First user is host
        const isFirstUser = room?.size === 0;
        const role = isFirstUser ? 'host' : 'participant';
        const status = isFirstUser ? 'joined' : 'waiting'; // Default to waiting for non-hosts if waiting room enabled (logic in controller)

        const participant: RoomParticipant = {
            socketId,
            peerId: socketId,
            username,
            role,
            status: 'joined' // For now, default to joined. Controller will override if waiting room is active.
        };

        if (room) {
            room.set(socketId, participant);
        }

        return participant;
    }

    leaveRoom(roomId: string, socketId: string): void {
        const participants = this.rooms.get(roomId);
        if (participants) {
            participants.delete(socketId);
            if (participants.size === 0) {
                this.rooms.delete(roomId);
            } else {
                // If host left, assign new host? For now, keep simple.
            }
        }
    }

    getPeers(roomId: string, excludeSocketId?: string): RoomParticipant[] {
        const participants = this.rooms.get(roomId);
        if (!participants) {
            return [];
        }
        const peers = Array.from(participants.values());
        // Only return joined peers
        const joinedPeers = peers.filter(p => p.status === 'joined');

        if (excludeSocketId) {
            return joinedPeers.filter(p => p.socketId !== excludeSocketId);
        }
        return joinedPeers;
    }

    getWaitingPeers(roomId: string): RoomParticipant[] {
        const participants = this.rooms.get(roomId);
        if (!participants) {
            return [];
        }
        return Array.from(participants.values()).filter(p => p.status === 'waiting');
    }

    updateParticipantStatus(roomId: string, socketId: string, status: 'joined' | 'waiting'): void {
        const room = this.rooms.get(roomId);
        const participant = room?.get(socketId);
        if (participant) {
            participant.status = status;
            room?.set(socketId, participant);
        }
    }

    getParticipant(roomId: string, socketId: string): RoomParticipant | undefined {
        return this.rooms.get(roomId)?.get(socketId);
    }

    removePeerFromAllRooms(socketId: string): string[] {
        const affectedRooms: string[] = [];
        this.rooms.forEach((participants, roomId) => {
            if (participants.has(socketId)) {
                participants.delete(socketId);
                affectedRooms.push(roomId);

                if (participants.size === 0) {
                    this.rooms.delete(roomId);
                }
            }
        });
        return affectedRooms;
    }

    getRoomSize(roomId: string): number {
        return this.rooms.get(roomId)?.size || 0;
    }
}

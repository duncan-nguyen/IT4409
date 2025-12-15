export interface RTCSessionDescriptionInit {
    type: 'offer' | 'answer';
    sdp: string;
}

export interface RTCIceCandidateInit {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
}

export interface RoomParticipant {
    socketId: string;
    peerId: string;
    username?: string;
    role: 'host' | 'participant';
    status: 'waiting' | 'joined';
}

export interface JoinRoomPayload {
    roomId: string;
    username?: string;
}

export interface OfferPayload {
    roomId: string;
    peerId: string;
    offer: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
    roomId: string;
    peerId: string;
    answer: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
    roomId: string;
    peerId: string;
    candidate: RTCIceCandidateInit;
}

export interface MessagePayload {
    roomId: string;
    peerId: string;
    text: string;
    timestamp: number;
}

export interface ReactionPayload {
    roomId: string;
    type: string;
}

export interface GesturePayload {
    roomId: string;
    gesture: string;
}

export interface KickUserPayload {
    roomId: string;
    targetPeerId: string;
}

export interface MuteUserPayload {
    roomId: string;
    targetPeerId: string;
}

export interface ApproveUserPayload {
    roomId: string;
    targetPeerId: string;
}

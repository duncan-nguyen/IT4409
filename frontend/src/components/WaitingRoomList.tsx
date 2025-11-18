'use client';

import { Check, X } from 'lucide-react';
import { Button } from './ui/button';

interface WaitingUser {
    peerId: string;
    username?: string;
}

interface WaitingRoomListProps {
    waitingUsers: WaitingUser[];
    onApprove: (peerId: string) => void;
    onDeny: (peerId: string) => void;
}

export default function WaitingRoomList({ waitingUsers, onApprove, onDeny }: WaitingRoomListProps) {
    if (waitingUsers.length === 0) return null;

    return (
        <div className="absolute top-20 right-6 z-40 glass-panel rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/10 bg-black/60 backdrop-blur-xl p-4 w-80">
            <h3 className="text-sm font-semibold mb-3 text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse"></span>
                    Waiting Room
                </span>
                <span className="bg-neon-blue/20 text-neon-blue border border-neon-blue/30 text-xs px-2 py-0.5 rounded-full">{waitingUsers.length}</span>
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {waitingUsers.map((user) => (
                    <div key={user.peerId} className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{user.username || 'Anonymous'}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Wants to join</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => onDeny(user.peerId)}
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-red-500/20 text-red-500 border border-transparent hover:border-red-500/30 transition-all"
                                title="Deny"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={() => onApprove(user.peerId)}
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-green-500/20 text-green-500 border border-transparent hover:border-green-500/30 transition-all"
                                title="Approve"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

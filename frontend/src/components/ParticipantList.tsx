'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

interface Participant {
    id: string;
    name: string;
    isMuted: boolean;
    isVideoOff: boolean;
}

interface ParticipantListProps {
    participants: Participant[];
    onMuteParticipant?: (participantId: string) => void;
    onKickParticipant?: (participantId: string) => void;
}

export default function ParticipantList({
    participants,
    onMuteParticipant,
    onKickParticipant
}: ParticipantListProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="p-4 bg-gray-800 border-gray-700">
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-white font-semibold">
                    Participants ({participants.length})
                </h3>
                <svg
                    className={`w-5 h-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isExpanded && (
                <div className="mt-4 space-y-2">
                    {participants.map((participant) => (
                        <div
                            key={participant.id}
                            className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">
                                        {participant.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-white text-sm">{participant.name}</p>
                                    <div className="flex space-x-2 text-xs text-gray-400">
                                        {participant.isMuted && <span>🔇 Muted</span>}
                                        {participant.isVideoOff && <span>📷 Video Off</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                {onMuteParticipant && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onMuteParticipant(participant.id)}
                                        className="text-xs"
                                    >
                                        {participant.isMuted ? 'Unmute' : 'Mute'}
                                    </Button>
                                )}
                                {onKickParticipant && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => onKickParticipant(participant.id)}
                                        className="text-xs"
                                    >
                                        Kick
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

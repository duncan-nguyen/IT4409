'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsUp, Smile, Star, Zap } from 'lucide-react';
import { Button } from './ui/button';

interface Reaction {
  id: string;
  type: string;
  x: number;
  timestamp: number;
}

interface ReactionsOverlayProps {
  socket: any;
  roomId: string;
}

const reactionIcons: Record<string, { icon: any; color: string }> = {
  heart: { icon: Heart, color: 'text-red-500' },
  like: { icon: ThumbsUp, color: 'text-blue-500' },
  smile: { icon: Smile, color: 'text-yellow-500' },
  star: { icon: Star, color: 'text-purple-500' },
  zap: { icon: Zap, color: 'text-orange-500' },
};

export default function ReactionsOverlay({ socket, roomId }: ReactionsOverlayProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_reaction', ({ type, peerId }: { type: string; peerId: string }) => {
      const newReaction: Reaction = {
        id: `${peerId}-${Date.now()}-${Math.random()}`,
        type,
        x: Math.random() * 80 + 10, // 10-90% from left
        timestamp: Date.now(),
      };
      setReactions((prev) => [...prev, newReaction]);

      // Auto remove after animation
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 3000);
    });

    return () => {
      socket.off('new_reaction');
    };
  }, [socket]);

  const sendReaction = (type: string) => {
    if (!socket) return;
    socket.emit('send_reaction', { roomId, type });
    
    // Add local reaction immediately
    const newReaction: Reaction = {
      id: `local-${Date.now()}-${Math.random()}`,
      type,
      x: Math.random() * 80 + 10,
      timestamp: Date.now(),
    };
    setReactions((prev) => [...prev, newReaction]);
    
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3000);
  };

  return (
    <>
      {/* Floating Reactions - Only show animations */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {reactions.map((reaction) => {
            const ReactionIcon = reactionIcons[reaction.type]?.icon || Heart;
            const color = reactionIcons[reaction.type]?.color || 'text-red-500';

            return (
              <motion.div
                key={reaction.id}
                initial={{ y: '100vh', opacity: 1, scale: 0 }}
                animate={{
                  y: '-20vh',
                  opacity: [1, 1, 0],
                  scale: [0, 1.5, 1],
                  rotate: [0, 10, -10, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  left: `${reaction.x}%`,
                  bottom: 0,
                }}
                className="drop-shadow-lg"
              >
                <ReactionIcon className={`w-12 h-12 ${color}`} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}

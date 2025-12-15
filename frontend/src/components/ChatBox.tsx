'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

interface Message {
  id: string;
  peerId: string;
  text: string;
  timestamp: number;
}

interface ChatBoxProps {
  socket: any;
  roomId: string;
  localPeerId: string;
}

export default function ChatBox({ socket, roomId, localPeerId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', ({ peerId, text, timestamp }: Omit<Message, 'id'>) => {
      const newMessage: Message = {
        id: `${peerId}-${timestamp}`,
        peerId,
        text,
        timestamp,
      };
      setMessages((prev) => [...prev, newMessage]);

      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [socket, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = () => {
    if (!inputText.trim() || !socket) return;

    const message = {
      peerId: localPeerId,
      text: inputText,
      timestamp: Date.now(),
    };

    socket.emit('send_message', { roomId, ...message });

    // Add to local messages immediately
    setMessages((prev) => [...prev, { ...message, id: `${localPeerId}-${message.timestamp}` }]);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel - Always open when rendered */}
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-24 right-6 w-80 h-[500px] glass-panel rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-40 flex flex-col overflow-hidden border-white/10 bg-black/60 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10 p-4 text-white backdrop-blur-md">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-neon-blue" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">Chat Room</span>
          </h3>
          <p className="text-xs text-gray-400">{messages.length} messages</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm mt-8 flex flex-col items-center gap-2">
              <MessageCircle className="w-8 h-8 opacity-20" />
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.peerId === localPeerId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-lg ${message.peerId === localPeerId
                      ? 'bg-gradient-to-br from-neon-blue/80 to-neon-purple/80 text-white rounded-tr-none'
                      : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/5'
                    }`}
                >
                  <p className="text-[10px] font-bold mb-1 opacity-70 uppercase tracking-wide">
                    {message.peerId === localPeerId ? 'You' : message.peerId.slice(0, 8)}
                  </p>
                  <p className="text-sm break-words leading-relaxed">{message.text}</p>
                  <p className="text-[10px] mt-1 opacity-50 text-right">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all"
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="rounded-xl w-10 h-10 p-0 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/50"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

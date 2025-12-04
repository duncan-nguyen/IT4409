'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isOpen, setIsOpen] = useState(false);
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
        className="fixed bottom-24 right-6 w-80 h-[500px] bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl z-40 flex flex-col overflow-hidden"
      >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat Room
              </h3>
              <p className="text-xs opacity-90">{messages.length} messages</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm mt-8">
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
                      className={`max-w-[75%] rounded-lg p-3 ${
                        message.peerId === localPeerId
                          ? 'bg-blue-500 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-80">
                        {message.peerId === localPeerId ? 'You' : message.peerId.slice(0, 8)}
                      </p>
                      <p className="text-sm break-words">{message.text}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={500}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="rounded-lg"
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

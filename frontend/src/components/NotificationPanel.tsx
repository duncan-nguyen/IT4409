'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

interface NotificationPanelProps {
  autoHideDuration?: number;
}

export default function NotificationPanel({ 
  autoHideDuration = 5000 
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: Notification['type'], message: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [...prev, newNotification]);

    if (autoHideDuration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoHideDuration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      default: return 'ℹ';
    }
  };

  // Expose addNotification globally for easy access
  useEffect(() => {
    (window as any).showNotification = addNotification;
    return () => {
      delete (window as any).showNotification;
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card 
          key={notification.id}
          className={`${getNotificationColor(notification.type)} p-4 shadow-lg animate-slide-in`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <span className="text-white text-xl font-bold">
                {getNotificationIcon(notification.type)}
              </span>
              <div>
                <p className="text-white text-sm font-medium">
                  {notification.message}
                </p>
                <p className="text-white text-xs opacity-80 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeNotification(notification.id)}
              className="text-white hover:bg-white/20 ml-2"
            >
              ✕
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

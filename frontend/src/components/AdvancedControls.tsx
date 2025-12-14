'use client';

import { useState, useRef } from 'react';
import { Monitor, MonitorOff, Video, Square, Download } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

interface AdvancedControlsProps {
  localStream: MediaStream | null;
  onScreenShareToggle: (stream: MediaStream | null) => void;
}

export default function AdvancedControls({
  localStream,
  onScreenShareToggle,
}: AdvancedControlsProps) {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      onScreenShareToggle(screenStream);

      // Stop sharing when user clicks browser's stop button
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    onScreenShareToggle(null);
  };

  const startRecording = () => {
    if (!localStream) {
      console.error('No stream to record');
      return;
    }

    try {
      const options = { mimeType: 'video/webm; codecs=vp9' };
      const mediaRecorder = new MediaRecorder(localStream, options);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedChunks([blob]);
        
        // Auto-download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('🔴 Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('⏹️ Recording stopped');
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex gap-3 items-center justify-center mt-4"
    >
      {/* Screen Share */}
      <Button
        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
        variant={isScreenSharing ? 'default' : 'outline'}
        className="flex items-center gap-2 transition-all hover:scale-105"
      >
        {isScreenSharing ? (
          <>
            <MonitorOff className="w-4 h-4" />
            Stop Sharing
          </>
        ) : (
          <>
            <Monitor className="w-4 h-4" />
            Share Screen
          </>
        )}
      </Button>

      {/* Recording */}
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        variant={isRecording ? 'destructive' : 'outline'}
        className="flex items-center gap-2 transition-all hover:scale-105"
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4 animate-pulse" />
            Stop Recording
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            Record
          </>
        )}
      </Button>

      {/* Download (if available) */}
      {recordedChunks.length > 0 && !isRecording && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Button
            onClick={() => {
              const url = URL.createObjectURL(recordedChunks[0]);
              const a = document.createElement('a');
              a.href = url;
              a.download = `recording-${Date.now()}.webm`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            variant="default"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Download Last Recording
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

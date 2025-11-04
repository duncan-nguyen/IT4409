import React, { useEffect, useRef } from 'react';
import { CircleDashed, Loader2 } from 'lucide-react';
import { useCallContext } from '../context/CallContext';

interface VideoPanelProps {
  title: string;
  isRemote?: boolean;
}

const VIDEO_URL = '../../public/video/rich_roll.mp4';

const VideoPanel: React.FC<VideoPanelProps> = ({ title, isRemote = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { filterActive, processingStatus, callStatus } = useCallContext();

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.loop = true;
      v.play().catch((e) => console.error('Video playback failed:', e));
    }
  }, []);

  const getFilterStyles = () => {
    if (!filterActive) return '';
    if (!isRemote) {
      return processingStatus === 'success'
        ? 'opacity-80 sepia brightness-125 saturate-150 transition-all duration-700'
        : 'opacity-100';
    }
    if (isRemote && callStatus === 'in-call') {
      return 'grayscale invert blur-sm transition-all duration-700';
    }
    return '';
  };

  return (
    <div className="flex-1 min-h-[300px] lg:min-h-full bg-black rounded-xl shadow-2xl relative overflow-hidden">
      <h2 className="absolute top-4 left-4 z-10 text-xl font-semibold bg-gray-900 bg-opacity-50 p-2 rounded">
        {title}
      </h2>

      {isRemote && callStatus === 'idle' ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <CircleDashed className="w-16 h-16 text-gray-500 animate-pulse" />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={VIDEO_URL}
          className={`w-full h-full object-cover ${getFilterStyles()}`}
          autoPlay
          playsInline
          muted
          loop
          title={title}
        />
      )}

      {/* Overlays */}
      {!isRemote && processingStatus === 'loading' && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
          <p className="mt-4 text-lg">Processing Video Stream with AI...</p>
        </div>
      )}

      {filterActive && !isRemote && processingStatus === 'success' && (
        <div className="absolute bottom-4 right-4 bg-emerald-500 text-white text-xs font-bold py-1 px-3 rounded-full z-10 animate-pulse">
          AI FILTER ACTIVE
        </div>
      )}
    </div>
  );
};

export default VideoPanel;

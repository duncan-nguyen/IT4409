import React from 'react';
import { Zap, PhoneCall, X, Loader2 } from 'lucide-react';
import { useCallContext } from '../context/CallContext';

const buttonClasses = (color = 'bg-gray-700') =>
  `p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center
     ${color} text-white hover:scale-105 active:scale-95 disabled:opacity-50`;

const Controls: React.FC = () => {
  const { applyFilterSimulation, processingStatus, filterActive, callStatus, startCall, endCall } = useCallContext();

  return (
    <footer className="mt-8 flex justify-center space-x-6">
      <button
        onClick={applyFilterSimulation}
        disabled={filterActive || processingStatus === 'loading'}
  className={buttonClasses(filterActive ? 'bg-emerald-600' : 'bg-gray-700')}
        title="Apply AI Filter via API Module"
      >
        {processingStatus === 'loading' ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Zap className={`w-6 h-6 ${filterActive ? 'text-yellow-300' : 'text-white'}`} />
        )}
        <span className="hidden sm:inline ml-2">{filterActive ? 'Filter Active' : 'Apply AI Filter'}</span>
      </button>

      {callStatus === 'idle' ? (
        <button
          onClick={startCall}
          className={buttonClasses('bg-emerald-600 hover:bg-emerald-500')}
          title="Start P2P Video Call"
        >
          <PhoneCall className="w-6 h-6" />
          <span className="hidden sm:inline ml-2">Start Call</span>
        </button>
      ) : (
        <button
          onClick={endCall}
          className={buttonClasses('bg-red-600 hover:bg-red-500')}
          title="End Call"
        >
          <X className="w-6 h-6" />
          <span className="hidden sm:inline ml-2">End Call</span>
        </button>
      )}
    </footer>
  );
};

export default Controls;

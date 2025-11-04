import React, { createContext, useCallback, useState, useContext } from 'react';

export type CallStatus = 'idle' | 'connecting' | 'in-call';
export type ProcessingStatus = 'idle' | "loading" | 'success' | 'error';

export interface CallContextValue {
  callStatus: CallStatus;
  processingStatus: ProcessingStatus;
  filterActive: boolean;
  userId: string;
  applyFilterSimulation: () => Promise<void>;
  startCall: () => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [filterActive, setFilterActive] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [userId] = useState(() => `User-7890`);

  const applyFilterSimulation = useCallback(async () => {
    if (processingStatus === 'loading') return;
    setProcessingStatus('loading');

    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setProcessingStatus('success');
      setFilterActive(true);
    } catch (e) {
      console.error('Mock: CV/ML API failed.', e);
      setProcessingStatus('error');
    }
  }, [processingStatus]);

  const startCall = useCallback(() => {
    if (callStatus !== 'idle') return;
    setCallStatus('connecting');

    setTimeout(() => {
      setCallStatus('in-call');
      console.log('Call established (Simulated P2P)');
    }, 3000);
  }, [callStatus]);

  const endCall = useCallback(() => {
    setCallStatus('idle');
    setFilterActive(false);
    setProcessingStatus('idle');
  }, []);

  const value: CallContextValue = {
    callStatus,
    processingStatus,
    filterActive,
    userId,
    applyFilterSimulation,
    startCall,
    endCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export function useCallContext() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCallContext must be used within CallProvider');
  return ctx;
}

export default CallContext;

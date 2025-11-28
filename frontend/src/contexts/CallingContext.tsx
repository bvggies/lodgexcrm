import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { voiceService, CallState } from '../services/twilio/voiceService';
import DialerPanel from '../components/calling/DialerPanel';
import IncomingCallPopup from '../components/calling/IncomingCallPopup';

interface CallingContextType {
  openDialer: (phoneNumber?: string, guestId?: string) => void;
  closeDialer: () => void;
  isDialerOpen: boolean;
  callState: CallState;
}

const CallingContext = createContext<CallingContextType | undefined>(undefined);

export const useCalling = () => {
  const context = useContext(CallingContext);
  if (!context) {
    throw new Error('useCalling must be used within CallingProvider');
  }
  return context;
};

interface CallingProviderProps {
  children: ReactNode;
}

export const CallingProvider: React.FC<CallingProviderProps> = ({ children }) => {
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [dialerPhoneNumber, setDialerPhoneNumber] = useState<string>('');
  const [dialerGuestId, setDialerGuestId] = useState<string | undefined>();
  const [callState, setCallState] = useState<CallState>({ status: 'idle' });
  const [incomingCall, setIncomingCall] = useState<{ visible: boolean; phoneNumber?: string }>({
    visible: false,
  });

  useEffect(() => {
    // Initialize voice service on mount
    if (!voiceService.isInitialized()) {
      voiceService.initialize().catch((error) => {
        console.error('Failed to initialize voice service:', error);
      });
    }

    const unsubscribe = voiceService.onStatusChange((status) => {
      setCallState(status);

      // Handle incoming calls
      if (status.status === 'ringing' && status.call) {
        setIncomingCall({ visible: true, phoneNumber: 'Incoming Call' });
      }

      // Close incoming call popup when call is answered or rejected
      if (status.status === 'connected' || status.status === 'idle') {
        setIncomingCall({ visible: false });
      }
    });

    return () => {
      unsubscribe();
      voiceService.destroy();
    };
  }, []);

  const openDialer = (phoneNumber?: string, guestId?: string) => {
    setDialerPhoneNumber(phoneNumber || '');
    setDialerGuestId(guestId);
    setIsDialerOpen(true);
  };

  const closeDialer = () => {
    setIsDialerOpen(false);
    setDialerPhoneNumber('');
    setDialerGuestId(undefined);
  };

  const handleAnswerCall = () => {
    setIncomingCall({ visible: false });
    setIsDialerOpen(true);
  };

  const handleRejectCall = () => {
    setIncomingCall({ visible: false });
  };

  return (
    <CallingContext.Provider
      value={{
        openDialer,
        closeDialer,
        isDialerOpen,
        callState,
      }}
    >
      {children}
      <DialerPanel
        visible={isDialerOpen}
        onClose={closeDialer}
        defaultNumber={dialerPhoneNumber}
        guestId={dialerGuestId}
      />
      <IncomingCallPopup
        visible={incomingCall.visible}
        phoneNumber={incomingCall.phoneNumber}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
      />
    </CallingContext.Provider>
  );
};

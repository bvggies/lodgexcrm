import apiClient from './client';

export interface CallHistory {
  id: string;
  userId: string;
  guestId?: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: string;
  callSid?: string;
  duration?: number;
  recordingSid?: string;
  recordingUrl?: string;
  recordingDuration?: number;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface TwilioTokenResponse {
  token: string;
  identity: string;
}

export const twilioApi = {
  getToken: () => {
    return apiClient.post<{ success: boolean; data: TwilioTokenResponse }>('/twilio/token');
  },

  makeCall: (data: { to: string; from?: string; guestId?: string }) => {
    return apiClient.post<{ success: boolean; message: string }>('/twilio/call', data);
  },

  getCallHistory: (params?: { guestId?: string; limit?: number; offset?: number }) => {
    return apiClient.get<{
      success: boolean;
      data: {
        calls: CallHistory[];
        total: number;
      };
    }>('/twilio/history', { params });
  },
};

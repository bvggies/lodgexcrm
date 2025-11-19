import apiClient from './client';

export interface Integration {
  id: string;
  type: 'airbnb' | 'booking_com';
  name: string;
  isActive: boolean;
  status: 'not_configured' | 'configured' | 'connected' | 'error';
  configured: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncError?: string;
  recentSyncs?: SyncHistory[];
}

export interface SyncHistory {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  created: number;
  updated: number;
}

export interface IntegrationDetail extends Integration {
  webhookUrl?: string;
  config?: any;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  syncHistory: SyncHistory[];
}

export interface ConfigureIntegrationData {
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  config?: any;
  isActive?: boolean;
}

export const integrationsApi = {
  getStatus: () => {
    return apiClient.get<{ success: boolean; data: Integration[] }>('/integrations/status');
  },

  getByType: (type: 'airbnb' | 'booking_com') => {
    return apiClient.get<{ success: boolean; data: IntegrationDetail }>(`/integrations/${type}`);
  },

  configure: (type: 'airbnb' | 'booking_com', config: ConfigureIntegrationData) => {
    return apiClient.post<{ success: boolean; data: Integration; message: string }>(
      `/integrations/${type}/configure`,
      { type, ...config }
    );
  },

  testConnection: (type: 'airbnb' | 'booking_com') => {
    return apiClient.post<{ success: boolean; message: string }>(`/integrations/${type}/test`);
  },

  syncAirbnb: (propertyMapping: Record<string, string>) => {
    return apiClient.post<{ success: boolean; data: any; message: string }>(
      '/integrations/airbnb/sync',
      { propertyMapping }
    );
  },

  syncBookingCom: (propertyMapping: Record<string, string>) => {
    return apiClient.post<{ success: boolean; data: any; message: string }>(
      '/integrations/bookingcom/sync',
      { propertyMapping }
    );
  },
};


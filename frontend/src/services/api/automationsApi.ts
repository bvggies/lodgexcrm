import apiClient from './client';

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions?: Record<string, any>;
  actions: Array<{
    type: string;
    params?: Record<string, any>;
  }>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationData {
  name: string;
  description?: string;
  trigger: string;
  conditions?: Record<string, any>;
  actions: Array<{
    type: string;
    params?: Record<string, any>;
  }>;
  enabled?: boolean;
}

export interface UpdateAutomationData extends Partial<CreateAutomationData> {}

export const automationsApi = {
  getAll: (params?: { trigger?: string; enabled?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.trigger) queryParams.append('trigger', params.trigger);
    if (params?.enabled !== undefined) queryParams.append('enabled', params.enabled.toString());
    
    const query = queryParams.toString();
    return apiClient.get<{ success: boolean; data: Automation[] }>(
      `/automations${query ? `?${query}` : ''}`
    );
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Automation }>(`/automations/${id}`);
  },

  create: (data: CreateAutomationData) => {
    return apiClient.post<{ success: boolean; data: Automation; message: string }>(
      '/automations',
      data
    );
  },

  update: (id: string, data: UpdateAutomationData) => {
    return apiClient.put<{ success: boolean; data: Automation; message: string }>(
      `/automations/${id}`,
      data
    );
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/automations/${id}`);
  },

  trigger: (trigger: string, data?: Record<string, any>) => {
    return apiClient.post<{ success: boolean; data: { triggered: number; errors: string[] }; message: string }>(
      '/automations/trigger',
      { trigger, data }
    );
  },
};


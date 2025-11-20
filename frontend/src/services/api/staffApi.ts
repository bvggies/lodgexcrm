import apiClient from './client';

export interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'assistant' | 'cleaner' | 'maintenance' | 'owner_view';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffData {
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'assistant' | 'cleaner' | 'maintenance' | 'owner_view';
  isActive?: boolean;
}

export const staffApi = {
  getAll: (params?: { role?: string; isActive?: boolean; search?: string }) => {
    return apiClient.get<{ success: boolean; data: { staff: Staff[] }; count: number }>('/staff', {
      params,
    });
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { staff: Staff } }>(`/staff/${id}`);
  },

  create: (data: CreateStaffData) => {
    return apiClient.post<{ success: boolean; data: { staff: Staff } }>('/staff', data);
  },

  update: (id: string, data: Partial<CreateStaffData>) => {
    return apiClient.put<{ success: boolean; data: { staff: Staff } }>(`/staff/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/staff/${id}`);
  },

  getTasks: (id: string) => {
    return apiClient.get<{ success: boolean; data: any }>(`/staff/${id}/tasks`);
  },
};

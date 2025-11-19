import apiClient from './client';

export interface MaintenanceTask {
  id: string;
  title: string;
  propertyId: string;
  unitId?: string;
  description?: string;
  type: 'ac' | 'plumbing' | 'electrical' | 'appliance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedToId?: string;
  status: 'open' | 'in_progress' | 'completed';
  photos?: string[];
  cost?: number;
  invoiceFile?: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const maintenanceApi = {
  getAll: (params?: {
    propertyId?: string;
    status?: string;
    priority?: string;
    type?: string;
    assignedToId?: string;
  }) => {
    return apiClient.get<{ success: boolean; data: { tasks: MaintenanceTask[] }; count: number }>(
      '/maintenance',
      { params }
    );
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { task: MaintenanceTask } }>(
      `/maintenance/${id}`
    );
  },

  create: (data: Partial<MaintenanceTask>) => {
    return apiClient.post<{ success: boolean; data: { task: MaintenanceTask } }>(
      '/maintenance',
      data
    );
  },

  update: (id: string, data: Partial<MaintenanceTask>) => {
    return apiClient.put<{ success: boolean; data: { task: MaintenanceTask } }>(
      `/maintenance/${id}`,
      data
    );
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/maintenance/${id}`);
  },

  resolve: (id: string, data: {
    photos?: string[];
    cost?: number;
    invoiceFile?: string;
    notes?: string;
  }) => {
    return apiClient.post<{ success: boolean; data: { task: MaintenanceTask } }>(
      `/maintenance/${id}/resolve`,
      data
    );
  },

  uploadPhoto: (id: string, data: { photoUrl: string }) => {
    return apiClient.post<{ success: boolean; data: { task: MaintenanceTask } }>(
      `/maintenance/${id}/photos`,
      data
    );
  },
};


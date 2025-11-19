import apiClient from './client';

export interface CleaningTask {
  id: string;
  cleaningId: string;
  propertyId: string;
  unitId?: string;
  bookingId?: string;
  scheduledDate: string;
  cleanerId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  beforePhotos?: string[];
  afterPhotos?: string[];
  checklist?: any;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const cleaningApi = {
  getAll: (params?: {
    propertyId?: string;
    status?: string;
    cleanerId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiClient.get<{ success: boolean; data: { tasks: CleaningTask[] }; count: number }>(
      '/cleaning',
      { params }
    );
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { task: CleaningTask } }>(`/cleaning/${id}`);
  },

  create: (data: Partial<CleaningTask>) => {
    return apiClient.post<{ success: boolean; data: { task: CleaningTask } }>('/cleaning', data);
  },

  update: (id: string, data: Partial<CleaningTask>) => {
    return apiClient.put<{ success: boolean; data: { task: CleaningTask } }>(
      `/cleaning/${id}`,
      data
    );
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/cleaning/${id}`);
  },

  complete: (id: string, data: { afterPhotos?: string[]; notes?: string; cost?: number }) => {
    return apiClient.post<{ success: boolean; data: { task: CleaningTask } }>(
      `/cleaning/${id}/complete`,
      data
    );
  },

  uploadPhoto: (id: string, data: { type: 'before' | 'after'; photoUrl: string }) => {
    return apiClient.post<{ success: boolean; data: { task: CleaningTask } }>(
      `/cleaning/${id}/photos`,
      data
    );
  },
};


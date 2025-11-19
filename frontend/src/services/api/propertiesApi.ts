import apiClient from './client';

export interface Property {
  id: string;
  name: string;
  code: string;
  unitType: string;
  address: any;
  locationLat?: number;
  locationLng?: number;
  ownerId: string;
  status: 'active' | 'inactive';
  dewaNumber?: string;
  dtcmPermitNumber?: string;
  amenities?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyData {
  name: string;
  code: string;
  unitType: string;
  address: any;
  locationLat?: number;
  locationLng?: number;
  ownerId: string;
  status?: 'active' | 'inactive';
  dewaNumber?: string;
  dtcmPermitNumber?: string;
  amenities?: any;
}

export const propertiesApi = {
  getAll: (params?: { status?: string; ownerId?: string; search?: string }) => {
    return apiClient.get<{ success: boolean; data: { properties: Property[] }; count: number }>(
      '/properties',
      { params }
    );
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { property: Property } }>(`/properties/${id}`);
  },

  create: (data: CreatePropertyData) => {
    return apiClient.post<{ success: boolean; data: { property: Property } }>('/properties', data);
  },

  update: (id: string, data: Partial<CreatePropertyData>) => {
    return apiClient.put<{ success: boolean; data: { property: Property } }>(
      `/properties/${id}`,
      data
    );
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/properties/${id}`);
  },
};


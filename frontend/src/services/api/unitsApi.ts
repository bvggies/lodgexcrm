import apiClient from './client';

export interface Unit {
  id: string;
  unitCode: string;
  propertyId: string;
  availabilityStatus: 'available' | 'occupied' | 'maintenance' | 'unavailable';
  amenities?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    bookings: number;
  };
}

export interface CreateUnitData {
  unitCode: string;
  propertyId: string;
  availabilityStatus?: 'available' | 'occupied' | 'maintenance' | 'unavailable';
  amenities?: any;
  notes?: string;
}

export const unitsApi = {
  getAll: (params?: {
    propertyId?: string;
    availabilityStatus?: string;
  }) => {
    return apiClient.get<{ success: boolean; data: { units: Unit[] }; count: number }>(
      '/units',
      { params }
    );
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { unit: Unit } }>(`/units/${id}`);
  },

  create: (data: CreateUnitData) => {
    return apiClient.post<{ success: boolean; data: { unit: Unit } }>('/units', data);
  },

  update: (id: string, data: Partial<CreateUnitData>) => {
    return apiClient.put<{ success: boolean; data: { unit: Unit } }>(`/units/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/units/${id}`);
  },
};


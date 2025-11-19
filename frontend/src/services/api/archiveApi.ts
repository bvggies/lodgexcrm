import apiClient from './client';

export interface ArchivedBooking {
  id: string;
  reference: string;
  property: {
    id: string;
    name: string;
    code: string;
  };
  guest: {
    id: string;
    firstName: string;
    lastName: string;
  };
  checkinDate: string;
  checkoutDate: string;
  totalAmount: number;
  currency: string;
  notes?: string;
}

export const archiveApi = {
  getArchivedBookings: (params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    return apiClient.get<{ success: boolean; data: { bookings: ArchivedBooking[] }; count: number }>(
      `/archive/bookings${query ? `?${query}` : ''}`
    );
  },

  archiveBooking: (id: string) => {
    return apiClient.post<{ success: boolean; message: string }>(`/archive/bookings/${id}`);
  },

  restoreBooking: (id: string) => {
    return apiClient.post<{ success: boolean; message: string }>(`/archive/bookings/${id}/restore`);
  },

  archiveGuest: (id: string) => {
    return apiClient.post<{ success: boolean; message: string }>(`/archive/guests/${id}`);
  },

  archiveProperty: (id: string) => {
    return apiClient.post<{ success: boolean; message: string }>(`/archive/properties/${id}`);
  },

  permanentlyDelete: (tableName: string, recordId: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/archive/${tableName}/${recordId}`
    );
  },
};


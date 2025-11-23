import apiClient from './client';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  passportScanUrl?: string;
  documents?: any;
  blacklist: boolean;
  totalSpend: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuestData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  passportScanUrl?: string;
  documents?: any;
  blacklist?: boolean;
}

export const guestsApi = {
  getAll: (params?: { blacklist?: boolean; search?: string; minSpend?: number }) => {
    return apiClient.get<{ success: boolean; data: { guests: Guest[] }; count: number }>(
      '/guests',
      { params }
    );
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { guest: Guest } }>(`/guests/${id}`);
  },

  create: (data: CreateGuestData) => {
    return apiClient.post<{ success: boolean; data: { guest: Guest } }>('/guests', data);
  },

  update: (id: string, data: Partial<CreateGuestData>) => {
    return apiClient.put<{ success: boolean; data: { guest: Guest } }>(`/guests/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/guests/${id}`);
  },

  getStayHistory: (id: string) => {
    return apiClient.get<{ success: boolean; data: { bookings: any[] }; count: number }>(
      `/guests/${id}/stay-history`
    );
  },

  getPaymentRecords: (id: string) => {
    return apiClient.get<{
      success: boolean;
      data: {
        records: any[];
        summary: {
          totalPaid: number;
          totalPending: number;
          totalRecords: number;
        };
      };
    }>(`/guests/${id}/payment-records`);
  },

  getSecurityDeposits: (id: string) => {
    return apiClient.get<{
      success: boolean;
      data: {
        deposits: any[];
        summary: {
          totalDeposits: number;
          activeDeposits: number;
          totalBookings: number;
        };
      };
    }>(`/guests/${id}/security-deposits`);
  },
};

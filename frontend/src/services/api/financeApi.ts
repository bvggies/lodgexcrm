import apiClient from './client';

export interface FinanceRecord {
  id: string;
  type: 'revenue' | 'expense';
  propertyId?: string;
  bookingId?: string;
  guestId?: string;
  amount: number;
  category: string;
  invoiceFile?: string;
  date: string;
  paymentMethod?: string;
  status: 'paid' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export const financeApi = {
  getAll: (params?: {
    propertyId?: string;
    bookingId?: string;
    type?: string;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiClient.get<{
      success: boolean;
      data: {
        records: FinanceRecord[];
        summary: {
          revenue: number;
          expenses: number;
          netIncome: number;
          count: number;
        };
      };
    }>('/finance', { params });
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { record: FinanceRecord } }>(`/finance/${id}`);
  },

  create: (data: Partial<FinanceRecord>) => {
    return apiClient.post<{ success: boolean; data: { record: FinanceRecord } }>('/finance', data);
  },

  update: (id: string, data: Partial<FinanceRecord>) => {
    return apiClient.put<{ success: boolean; data: { record: FinanceRecord } }>(
      `/finance/${id}`,
      data
    );
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/finance/${id}`);
  },

  getMonthlyReport: (params?: { propertyId?: string; month?: string }) => {
    return apiClient.get<{ success: boolean; data: any }>('/finance/reports/monthly', {
      params,
    });
  },

  export: (params: {
    format: 'csv' | 'pdf';
    propertyId?: string;
    startDate?: string;
    endDate?: string;
    month?: string;
  }) => {
    return apiClient.get('/finance/export', {
      params,
      responseType: 'blob',
    });
  },
};

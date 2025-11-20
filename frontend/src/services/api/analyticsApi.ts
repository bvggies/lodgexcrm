import apiClient from './client';

export const analyticsApi = {
  getDashboardSummary: () => {
    return apiClient.get<{
      success: boolean;
      data: {
        summary: any;
        financial: any;
        occupancy: any;
        upcomingCheckins: any[];
        upcomingCheckouts: any[];
        unpaidBookings: any[];
      };
    }>('/analytics/summary');
  },

  getPropertyAnalytics: (id: string, params?: { startDate?: string; endDate?: string }) => {
    return apiClient.get<{ success: boolean; data: any }>(`/analytics/property/${id}`, { params });
  },

  getRevenueExpenseChart: (params?: {
    startDate?: string;
    endDate?: string;
    propertyId?: string;
  }) => {
    return apiClient.get<{ success: boolean; data: { chartData: any[] } }>(
      '/analytics/revenue-expense',
      { params }
    );
  },

  getOccupancyRates: (params?: { startDate?: string; endDate?: string }) => {
    return apiClient.get<{ success: boolean; data: any }>('/analytics/occupancy', { params });
  },

  getRepeatGuests: () => {
    return apiClient.get<{ success: boolean; data: any }>('/analytics/repeat-guests');
  },

  export: (params?: { startDate?: string; endDate?: string; format?: 'csv' | 'pdf' }) => {
    return apiClient.get<Blob>('/analytics/export', {
      params,
      responseType: 'blob',
    });
  },
};

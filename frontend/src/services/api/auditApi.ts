import apiClient from './client';

export interface AuditLog {
  id: string;
  action: string;
  tableName: string;
  recordId: string;
  userId: string;
  changeSummary?: any;
  timestamp: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const auditApi = {
  getAll: (params?: {
    userId?: string;
    tableName?: string;
    action?: string;
    recordId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    return apiClient.get<{
      success: boolean;
      data: { logs: AuditLog[] };
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>('/audit', { params });
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { log: AuditLog } }>(`/audit/${id}`);
  },

  getRecordHistory: (tableName: string, recordId: string) => {
    return apiClient.get<{
      success: boolean;
      data: {
        tableName: string;
        recordId: string;
        history: AuditLog[];
        count: number;
      };
    }>(`/audit/history/${tableName}/${recordId}`);
  },
};


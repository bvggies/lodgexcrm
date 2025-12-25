import apiClient from './client';

export interface Owner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  bankDetails?: any;
  paymentMethod?: string;
  idDocuments?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOwnerData {
  name: string;
  email?: string;
  phone?: string;
  bankDetails?: any;
  paymentMethod?: string;
  idDocuments?: any;
  notes?: string;
}

export const ownersApi = {
  getAll: (params?: { search?: string }) => {
    return apiClient.get<{ success: boolean; data: { owners: Owner[] }; count: number }>(
      '/owners',
      { params }
    );
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { owner: Owner } }>(`/owners/${id}`);
  },

  create: (data: CreateOwnerData) => {
    return apiClient.post<{ success: boolean; data: { owner: Owner } }>('/owners', data);
  },

  update: (id: string, data: Partial<CreateOwnerData>) => {
    return apiClient.put<{ success: boolean; data: { owner: Owner } }>(`/owners/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/owners/${id}`);
  },

  getStatements: (id: string, params?: { month?: string }) => {
    return apiClient.get<{ success: boolean; data: any }>(`/owners/${id}/statements`, { params });
  },

  getMyData: () => {
    return apiClient.get<{ success: boolean; data: any }>('/owners/me/data');
  },

  getMyStatements: (params?: { month?: string; startDate?: string; endDate?: string }) => {
    return apiClient.get<{ success: boolean; data: any }>('/owners/me/statements', { params });
  },

  exportStatementPDF: (
    id?: string,
    params?: { month?: string; startDate?: string; endDate?: string }
  ) => {
    const url = id ? `/owners/${id}/statements/pdf` : '/owners/me/statements/pdf';
    return apiClient.get<Blob>(url, {
      params,
      responseType: 'blob',
    });
  },

  getDetails: (id: string) => {
    return apiClient.get<{
      success: boolean;
      data: {
        owner: Owner;
        properties: any[];
        units: any[];
        financeRecords: any[];
        summary: {
          totalProperties: number;
          totalUnits: number;
          totalRevenue: number;
          totalExpenses: number;
          netIncome: number;
        };
      };
    }>(`/owners/${id}/details`);
  },

  assignProperties: (id: string, propertyIds: string[]) => {
    return apiClient.post<{ success: boolean; message: string; data: { assignedCount: number } }>(
      `/owners/${id}/assign-properties`,
      { propertyIds }
    );
  },

  unassignProperty: (id: string, propertyId: string, newOwnerId: string) => {
    return apiClient.post<{ success: boolean; message: string }>(
      `/owners/${id}/properties/${propertyId}/unassign`,
      { newOwnerId }
    );
  },
};

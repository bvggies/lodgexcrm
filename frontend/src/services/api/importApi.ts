import apiClient from '../../utils/apiClient';

export interface ImportResult {
  imported: number;
  failed: number;
  total: number;
  errors: string[];
  warnings: string[];
}

export const importApi = {
  /**
   * Download Excel template
   */
  downloadTemplate: (
    type: 'properties' | 'guests' | 'bookings' | 'finance' | 'owners' | 'staff'
  ) => {
    return apiClient.get<Blob>(`/import/template?type=${type}`, {
      responseType: 'blob',
    });
  },

  /**
   * Import data from Excel file
   */
  importData: (
    file: File,
    type: 'properties' | 'guests' | 'bookings' | 'finance' | 'owners' | 'staff'
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return apiClient.post<{ success: boolean; data: ImportResult }>('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

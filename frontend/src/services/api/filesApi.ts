import apiClient from './client';

export const filesApi = {
  upload: async (file: File, folder?: string): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await apiClient.post<{
      success: boolean;
      data: { url: string; key: string; bucket: string };
    }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  getSignedUrl: (key: string) => {
    return apiClient.get<{ success: boolean; data: { url: string } }>(`/files/signed-url/${key}`);
  },
};


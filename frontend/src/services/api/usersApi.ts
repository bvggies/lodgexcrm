import apiClient from './client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'assistant' | 'cleaner' | 'maintenance' | 'owner_view' | 'guest';
  phone?: string;
  isActive: boolean;
  guestId?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'assistant' | 'cleaner' | 'maintenance' | 'owner_view' | 'guest';
  phone?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'assistant' | 'cleaner' | 'maintenance' | 'owner_view' | 'guest';
  phone?: string;
  isActive?: boolean;
}

export const usersApi = {
  getAll: (params?: { role?: string; isActive?: boolean; search?: string }) => {
    return apiClient.get<{ success: boolean; data: { users: User[] }; count: number }>('/users', {
      params,
    });
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { user: User } }>(`/users/${id}`);
  },

  create: (data: CreateUserData) => {
    return apiClient.post<{ success: boolean; data: { user: User } }>('/users', data);
  },

  update: (id: string, data: UpdateUserData) => {
    return apiClient.put<{ success: boolean; data: { user: User } }>(`/users/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`);
  },
};

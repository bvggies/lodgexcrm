import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    guestId?: string | null;
  };
}

export interface RegisterGuestData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  nationality?: string;
}

export const authApi = {
  login: (credentials: LoginCredentials) => {
    return apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
  },

  register: (data: RegisterData) => {
    return apiClient.post<{ success: boolean; data: { user: any } }>('/auth/register', data);
  },

  registerGuest: (data: RegisterGuestData) => {
    return apiClient.post<{ success: boolean; data: { user: any; guest: any } }>(
      '/auth/register-guest',
      data
    );
  },

  refreshToken: (refreshToken: string) => {
    return apiClient.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh', {
      refreshToken,
    });
  },

  getMe: () => {
    return apiClient.get<{ success: boolean; data: { user: any; guest?: any } }>('/auth/me');
  },
};

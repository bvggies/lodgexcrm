import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response) {
      const { status, data, config } = error.response;
      const isLoginRequest = config?.url?.includes('/auth/login');

      switch (status) {
        case 401:
          // Don't logout/redirect for login failures - let the login page handle the error
          if (!isLoginRequest) {
            // Unauthorized - logout user (only for authenticated requests)
            store.dispatch(logout());
            message.error('Session expired. Please login again.');
            window.location.href = '/login';
          }
          break;

        case 403:
          message.error('You do not have permission to perform this action.');
          break;

        case 404:
          message.error('Resource not found.');
          break;

        case 422:
          // Validation errors
          const validationErrors = data?.error?.details || data?.details || [];
          if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            validationErrors.forEach((err: any) => {
              message.error(err.message || 'Validation error');
            });
          } else {
            message.error(data?.error?.message || data?.message || 'Validation error');
          }
          break;

        case 429:
          message.error('Too many requests. Please try again later.');
          break;

        case 500:
          message.error('Server error. Please try again later.');
          break;

        case 503:
          message.error('Service unavailable. Please try again later.');
          break;

        default:
          const errorMessage =
            data?.error?.message || data?.message || error.message || 'An error occurred';
          message.error(errorMessage);
      }
    } else if (error.request) {
      // Network error
      message.error('Network error. Please check your connection.');
    } else {
      message.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;

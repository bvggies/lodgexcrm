/**
 * Centralized error handling utilities
 */

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    return {
      message: data?.error?.message || data?.message || 'An error occurred',
      status,
      details: data?.error?.details || data?.details,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
    };
  }
};

export const formatValidationErrors = (details: any[]): string[] => {
  if (!Array.isArray(details)) return [];
  return details.map((err: any) => err.message || err.msg || 'Validation error');
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

export const isTimeoutError = (error: any): boolean => {
  return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
};


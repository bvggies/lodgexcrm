/**
 * Environment configuration
 */

export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  environment: process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  enableErrorReporting: process.env.REACT_APP_ENABLE_ERROR_REPORTING === 'true',
};

export default config;


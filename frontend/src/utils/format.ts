/**
 * Formatting utilities
 */

import dayjs from 'dayjs';

export const formatCurrency = (amount: number, currency: string = 'AED'): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date, format: string = 'DD MMM YYYY'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD MMM YYYY HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

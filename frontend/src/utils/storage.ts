/**
 * Safe storage utility with error handling
 * Handles cases where localStorage might not be available
 * (private browsing, disabled storage, etc.)
 */

const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

export const storage = {
  getItem: (key: string): string | null => {
    if (!isStorageAvailable()) {
      console.warn('localStorage is not available');
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Error reading from localStorage: ${error}`);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage: ${error}`);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (!isStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage: ${error}`);
      return false;
    }
  },

  clear: (): boolean => {
    if (!isStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn(`Error clearing localStorage: ${error}`);
      return false;
    }
  },
};

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
};

// Load notifications from localStorage on init
const loadNotificationsFromStorage = (): Notification[] => {
  try {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load notifications from storage:', error);
  }
  return [];
};

// Save notifications to localStorage
const saveNotificationsToStorage = (notifications: Notification[]) => {
  try {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications to storage:', error);
  }
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    ...initialState,
    notifications: loadNotificationsFromStorage(),
    unreadCount: loadNotificationsFromStorage().filter((n) => !n.read).length,
  },
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'id' | 'read' | 'createdAt'>>
    ) => {
      const newNotification: Notification = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random()}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      state.notifications.unshift(newNotification);
      state.unreadCount = state.notifications.filter((n) => !n.read).length;
      saveNotificationsToStorage(state.notifications);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
        state.unreadCount = state.notifications.filter((n) => !n.read).length;
        saveNotificationsToStorage(state.notifications);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => (n.read = true));
      state.unreadCount = 0;
      saveNotificationsToStorage(state.notifications);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      state.unreadCount = state.notifications.filter((n) => !n.read).length;
      saveNotificationsToStorage(state.notifications);
    },
    clearAll: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      saveNotificationsToStorage([]);
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, removeNotification, clearAll } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;

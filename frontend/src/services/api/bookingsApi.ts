import apiClient from './client';

export interface Booking {
  id: string;
  reference: string;
  propertyId: string;
  unitId?: string;
  guestId: string;
  channel: 'airbnb' | 'booking_com' | 'direct' | 'other';
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  totalAmount: number;
  currency: string;
  paymentStatus: 'paid' | 'pending' | 'partial' | 'refunded';
  depositAmount?: number;
  cleaningTaskId?: string;
  maintenanceTaskId?: string;
  bookingDocuments?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  propertyId: string;
  unitId?: string;
  guestId: string;
  channel: 'airbnb' | 'booking_com' | 'direct' | 'other';
  checkinDate: string;
  checkoutDate: string;
  totalAmount: number;
  currency?: string;
  paymentStatus?: 'paid' | 'pending' | 'partial' | 'refunded';
  depositAmount?: number;
  autoCreateCleaningTask?: boolean;
  notes?: string;
}

export const bookingsApi = {
  getAll: (params?: {
    propertyId?: string;
    guestId?: string;
    guestEmail?: string;
    status?: string;
    channel?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    return apiClient.get<{ success: boolean; data: { bookings: Booking[] }; count: number }>(
      '/bookings',
      { params }
    );
  },

  getCalendar: (params: { start: string; end: string; propertyId?: string }) => {
    return apiClient.get<{
      success: boolean;
      data: { events: any[]; bookings: Booking[] };
    }>('/bookings/calendar', { params });
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: { booking: Booking } }>(`/bookings/${id}`);
  },

  create: (data: CreateBookingData) => {
    return apiClient.post<{ success: boolean; data: { booking: Booking } }>('/bookings', data);
  },

  update: (id: string, data: Partial<CreateBookingData>) => {
    return apiClient.put<{ success: boolean; data: { booking: Booking } }>(`/bookings/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/bookings/${id}`);
  },

  checkIn: (id: string) => {
    return apiClient.post<{ success: boolean; message: string }>(`/bookings/${id}/checkin`);
  },

  checkOut: (id: string) => {
    return apiClient.post<{ success: boolean; message: string }>(`/bookings/${id}/checkout`);
  },

  getReminders: (days?: number) => {
    return apiClient.get<{
      success: boolean;
      data: {
        checkinReminders: any[];
        checkoutReminders: any[];
        summary: {
          checkinsToday: number;
          checkinsTomorrow: number;
          checkoutsToday: number;
          checkoutsTomorrow: number;
        };
      };
    }>('/bookings/reminders', { params: { days } });
  },
};

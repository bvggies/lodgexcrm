import prisma from '../../config/database';
import { BookingChannel } from '@prisma/client';

export interface BookingComBooking {
  reservation_id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  arrival_date: string;
  departure_date: string;
  total_price: number;
  currency: string;
  status: string;
}

export interface BookingComSyncResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}

export class BookingComService {
  private apiKey?: string;
  private apiSecret?: string;

  constructor(apiKey?: string, apiSecret?: string) {
    this.apiKey = apiKey || process.env.BOOKINGCOM_API_KEY || 'mock-api-key';
    this.apiSecret = apiSecret || process.env.BOOKINGCOM_API_SECRET || 'mock-api-secret';
  }

  /**
   * Test connection to Booking.com API
   */
  async testConnection(apiKey?: string, apiSecret?: string): Promise<{ success: boolean; message: string }> {
    const key = apiKey || this.apiKey;
    const secret = apiSecret || this.apiSecret;

    if (!key || !secret || key === 'mock-api-key') {
      return { success: false, message: 'API credentials not configured' };
    }

    try {
      // In production, make actual API call to test connection
      // const response = await fetch('https://api.booking.com/v3/me', {
      //   headers: {
      //     'Authorization': `Bearer ${key}`,
      //     'X-API-Key': key
      //   }
      // });
      // if (response.ok) {
      //   return { success: true, message: 'Connection successful' };
      // }

      // Mock test for development
      console.log('🔌 [MOCK] Testing Booking.com API connection');
      return { success: true, message: 'Connection test successful (mock)' };
    } catch (error: any) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  /**
   * Mock method to fetch bookings from Booking.com API
   * In production, this would make actual API calls to Booking.com
   */
  async fetchBookings(startDate?: Date, endDate?: Date): Promise<BookingComBooking[]> {
    // Mock data for development/testing
    // In production, replace with actual Booking.com API call:
    // const response = await fetch(`https://api.booking.com/v3/reservations?arrival_date=${startDate}&departure_date=${endDate}`, {
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'X-API-Key': this.apiKey
    //   }
    // });
    // return response.json();

    console.log('🔌 [MOCK] Fetching bookings from Booking.com API');
    console.log('📝 Note: Replace with real Booking.com API integration using provided credentials');

    // Return mock data
    return [
      {
        reservation_id: 'BC-001',
        property_id: 'PROP-001',
        guest_name: 'Robert Johnson',
        guest_email: 'robert.johnson@example.com',
        arrival_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        departure_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        total_price: 600.00,
        currency: 'AED',
        status: 'confirmed',
      },
      {
        reservation_id: 'BC-002',
        property_id: 'PROP-002',
        guest_name: 'Emily Davis',
        guest_email: 'emily.davis@example.com',
        arrival_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        departure_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        total_price: 900.00,
        currency: 'AED',
        status: 'confirmed',
      },
    ];
  }

  /**
   * Sync bookings from Booking.com to local database
   */
  async syncBookings(propertyMapping: Record<string, string>): Promise<BookingComSyncResult> {
    const result: BookingComSyncResult = {
      success: true,
      created: 0,
      updated: 0,
      errors: [],
    };

    try {
      const bookingComBookings = await this.fetchBookings();

      for (const bookingComBooking of bookingComBookings) {
        try {
          // Map Booking.com property_id to local property_id
          const propertyId = propertyMapping[bookingComBooking.property_id];

          if (!propertyId) {
            result.errors.push(
              `No property mapping found for Booking.com property ${bookingComBooking.property_id}`
            );
            continue;
          }

          // Find or create guest
          let guest = await prisma.guest.findFirst({
            where: {
              email: bookingComBooking.guest_email,
            },
          });

          if (!guest) {
            const [firstName, ...lastNameParts] = bookingComBooking.guest_name.split(' ');
            guest = await prisma.guest.create({
              data: {
                firstName: firstName || 'Unknown',
                lastName: lastNameParts.join(' ') || 'Guest',
                email: bookingComBooking.guest_email,
              },
            });
          }

          // Check if booking already exists
          const existingBooking = await prisma.booking.findFirst({
            where: {
              reference: `BC-${bookingComBooking.reservation_id}`,
            },
          });

          if (existingBooking) {
            // Update existing booking
            await prisma.booking.update({
              where: { id: existingBooking.id },
              data: {
                checkinDate: new Date(bookingComBooking.arrival_date),
                checkoutDate: new Date(bookingComBooking.departure_date),
                totalAmount: bookingComBooking.total_price,
                currency: bookingComBooking.currency,
                paymentStatus: bookingComBooking.status === 'confirmed' ? 'paid' : 'pending',
              },
            });
            result.updated++;
          } else {
            // Create new booking
            const checkin = new Date(bookingComBooking.arrival_date);
            const checkout = new Date(bookingComBooking.departure_date);
            const nights = Math.ceil(
              (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)
            );

            await prisma.booking.create({
              data: {
                reference: `BC-${bookingComBooking.reservation_id}`,
                propertyId,
                guestId: guest.id,
                channel: BookingChannel.booking_com,
                checkinDate: checkin,
                checkoutDate: checkout,
                nights,
                totalAmount: bookingComBooking.total_price,
                currency: bookingComBooking.currency,
                paymentStatus: bookingComBooking.status === 'confirmed' ? 'paid' : 'pending',
              },
            });
            result.created++;
          }
        } catch (error: any) {
          result.errors.push(
            `Error processing booking ${bookingComBooking.reservation_id}: ${error.message}`
          );
        }
      }
    } catch (error: any) {
      result.success = false;
      result.errors.push(`Sync failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Process webhook from Booking.com
   */
  async processWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature in production
      // const signature = req.headers['x-bookingcom-signature'];
      // if (!this.verifySignature(payload, signature)) {
      //   throw new Error('Invalid webhook signature');
      // }

      const eventType = payload.event_type; // reservation.created, reservation.updated, reservation.cancelled

      switch (eventType) {
        case 'reservation.created':
        case 'reservation.updated':
          // Handle reservation creation/update
          return { success: true, message: 'Reservation webhook processed' };

        case 'reservation.cancelled':
          // Handle reservation cancellation
          const bookingRef = `BC-${payload.reservation_id}`;
          const booking = await prisma.booking.findFirst({
            where: { reference: bookingRef },
          });

          if (booking) {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { paymentStatus: 'refunded' },
            });
          }

          return { success: true, message: 'Reservation cancellation processed' };

        default:
          return { success: false, message: `Unknown event type: ${eventType}` };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const bookingComService = new BookingComService();


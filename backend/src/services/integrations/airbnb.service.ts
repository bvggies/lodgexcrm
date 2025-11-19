import prisma from '../../config/database';
import { BookingChannel } from '@prisma/client';

export interface AirbnbBooking {
  id: string;
  listing_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number;
  currency: string;
  status: string;
}

export interface AirbnbSyncResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}

export class AirbnbService {
  private apiKey?: string;
  private apiSecret?: string;

  constructor(apiKey?: string, apiSecret?: string) {
    this.apiKey = apiKey || process.env.AIRBNB_API_KEY || 'mock-api-key';
    this.apiSecret = apiSecret || process.env.AIRBNB_API_SECRET || 'mock-api-secret';
  }

  /**
   * Test connection to Airbnb API
   */
  async testConnection(apiKey?: string, apiSecret?: string): Promise<{ success: boolean; message: string }> {
    const key = apiKey || this.apiKey;
    const secret = apiSecret || this.apiSecret;

    if (!key || !secret || key === 'mock-api-key') {
      return { success: false, message: 'API credentials not configured' };
    }

    try {
      // In production, make actual API call to test connection
      // const response = await fetch('https://api.airbnb.com/v2/me', {
      //   headers: {
      //     'Authorization': `Bearer ${key}`,
      //     'X-Airbnb-API-Key': key
      //   }
      // });
      // if (response.ok) {
      //   return { success: true, message: 'Connection successful' };
      // }

      // Mock test for development
      console.log('🔌 [MOCK] Testing Airbnb API connection');
      return { success: true, message: 'Connection test successful (mock)' };
    } catch (error: any) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  /**
   * Mock method to fetch bookings from Airbnb API
   * In production, this would make actual API calls to Airbnb
   */
  async fetchBookings(startDate?: Date, endDate?: Date): Promise<AirbnbBooking[]> {
    // Mock data for development/testing
    // In production, replace with actual Airbnb API call:
    // const response = await fetch(`https://api.airbnb.com/v2/bookings?start_date=${startDate}&end_date=${endDate}`, {
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'X-Airbnb-API-Key': this.apiKey
    //   }
    // });
    // return response.json();

    console.log('🔌 [MOCK] Fetching bookings from Airbnb API');
    console.log('📝 Note: Replace with real Airbnb API integration using provided credentials');

    // Return mock data
    return [
      {
        id: 'airbnb-001',
        listing_id: '12345',
        guest_name: 'John Doe',
        guest_email: 'john.doe@example.com',
        check_in: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        check_out: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        total_price: 500.00,
        currency: 'AED',
        status: 'confirmed',
      },
      {
        id: 'airbnb-002',
        listing_id: '12346',
        guest_name: 'Jane Smith',
        guest_email: 'jane.smith@example.com',
        check_in: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        check_out: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        total_price: 750.00,
        currency: 'AED',
        status: 'confirmed',
      },
    ];
  }

  /**
   * Sync bookings from Airbnb to local database
   */
  async syncBookings(propertyMapping: Record<string, string>): Promise<AirbnbSyncResult> {
    const result: AirbnbSyncResult = {
      success: true,
      created: 0,
      updated: 0,
      errors: [],
    };

    try {
      const airbnbBookings = await this.fetchBookings();

      for (const airbnbBooking of airbnbBookings) {
        try {
          // Map Airbnb listing_id to local property_id
          const propertyId = propertyMapping[airbnbBooking.listing_id];

          if (!propertyId) {
            result.errors.push(
              `No property mapping found for Airbnb listing ${airbnbBooking.listing_id}`
            );
            continue;
          }

          // Find or create guest
          let guest = await prisma.guest.findFirst({
            where: {
              email: airbnbBooking.guest_email,
            },
          });

          if (!guest) {
            const [firstName, ...lastNameParts] = airbnbBooking.guest_name.split(' ');
            guest = await prisma.guest.create({
              data: {
                firstName: firstName || 'Unknown',
                lastName: lastNameParts.join(' ') || 'Guest',
                email: airbnbBooking.guest_email,
              },
            });
          }

          // Check if booking already exists
          const existingBooking = await prisma.booking.findFirst({
            where: {
              reference: `AIRBNB-${airbnbBooking.id}`,
            },
          });

          if (existingBooking) {
            // Update existing booking
            await prisma.booking.update({
              where: { id: existingBooking.id },
              data: {
                checkinDate: new Date(airbnbBooking.check_in),
                checkoutDate: new Date(airbnbBooking.check_out),
                totalAmount: airbnbBooking.total_price,
                currency: airbnbBooking.currency,
                paymentStatus: airbnbBooking.status === 'confirmed' ? 'paid' : 'pending',
              },
            });
            result.updated++;
          } else {
            // Create new booking
            const checkin = new Date(airbnbBooking.check_in);
            const checkout = new Date(airbnbBooking.check_out);
            const nights = Math.ceil(
              (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)
            );

            await prisma.booking.create({
              data: {
                reference: `AIRBNB-${airbnbBooking.id}`,
                propertyId,
                guestId: guest.id,
                channel: BookingChannel.airbnb,
                checkinDate: checkin,
                checkoutDate: checkout,
                nights,
                totalAmount: airbnbBooking.total_price,
                currency: airbnbBooking.currency,
                paymentStatus: airbnbBooking.status === 'confirmed' ? 'paid' : 'pending',
              },
            });
            result.created++;
          }
        } catch (error: any) {
          result.errors.push(`Error processing booking ${airbnbBooking.id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      result.success = false;
      result.errors.push(`Sync failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Process webhook from Airbnb
   */
  async processWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature in production
      // const signature = req.headers['x-airbnb-signature'];
      // if (!this.verifySignature(payload, signature)) {
      //   throw new Error('Invalid webhook signature');
      // }

      const eventType = payload.event_type; // booking.created, booking.updated, booking.cancelled

      switch (eventType) {
        case 'booking.created':
        case 'booking.updated':
          // Handle booking creation/update
          // Similar logic to syncBookings but for single booking
          return { success: true, message: 'Booking webhook processed' };

        case 'booking.cancelled':
          // Handle booking cancellation
          const bookingRef = `AIRBNB-${payload.booking_id}`;
          const booking = await prisma.booking.findFirst({
            where: { reference: bookingRef },
          });

          if (booking) {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { paymentStatus: 'refunded' },
            });
          }

          return { success: true, message: 'Booking cancellation processed' };

        default:
          return { success: false, message: `Unknown event type: ${eventType}` };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const airbnbService = new AirbnbService();


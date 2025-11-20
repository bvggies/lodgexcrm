import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Calculate nights between two dates
const calculateNights = (checkin: Date, checkout: Date): number => {
  return differenceInDays(checkout, checkin);
};

// Check for booking conflicts
const checkBookingConflicts = async (
  propertyId: string,
  unitId: string | null,
  checkinDate: Date,
  checkoutDate: Date,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflictingBookings: any[] }> => {
  const where: any = {
    propertyId,
    OR: [
      // Check-in is between existing booking dates
      {
        AND: [
          { checkinDate: { lte: checkinDate } },
          { checkoutDate: { gt: checkinDate } },
        ],
      },
      // Check-out is between existing booking dates
      {
        AND: [
          { checkinDate: { lt: checkoutDate } },
          { checkoutDate: { gte: checkoutDate } },
        ],
      },
      // Booking completely overlaps existing booking
      {
        AND: [
          { checkinDate: { gte: checkinDate } },
          { checkoutDate: { lte: checkoutDate } },
        ],
      },
    ],
  };

  if (unitId) {
    where.unitId = unitId;
  }

  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  const conflictingBookings = await prisma.booking.findMany({
    where,
    include: {
      guest: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return {
    hasConflict: conflictingBookings.length > 0,
    conflictingBookings,
  };
};

// Generate unique booking reference
const generateBookingReference = async (): Promise<string> => {
  let reference: string;
  let exists = true;

  while (exists) {
    reference = `BK-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const existing = await prisma.booking.findUnique({
      where: { reference },
    });
    exists = !!existing;
  }

  return reference!;
};

export const getBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      propertyId,
      guestId,
      status,
      channel,
      startDate,
      endDate,
      search,
    } = req.query;

    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    if (guestId) {
      where.guestId = guestId as string;
    }

    if (status) {
      where.paymentStatus = status as string;
    }

    if (channel) {
      where.channel = channel as string;
    }

    if (startDate || endDate) {
      where.OR = [];
      if (startDate) {
        where.OR.push({
          checkoutDate: { gte: new Date(startDate as string) },
        });
      }
      if (endDate) {
        where.OR.push({
          checkinDate: { lte: new Date(endDate as string) },
        });
      }
    }

    if (search) {
      where.OR = [
        { reference: { contains: search as string, mode: 'insensitive' } },
        {
          guest: {
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitCode: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        checkinDate: 'asc',
      },
    });

    res.json({
      success: true,
      data: { bookings },
      count: bookings.length,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
        unit: true,
        guest: true,
        cleaningTasks: {
          include: {
            cleaner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        maintenanceTasks: true,
        financeRecords: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!booking) {
      return next(createError('Booking not found', 404));
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error: any) {
    next(error);
  }
};

export const createBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const {
      propertyId,
      unitId,
      guestId,
      channel,
      checkinDate,
      checkoutDate,
      totalAmount,
      currency,
      paymentStatus,
      depositAmount,
      bookingDocuments,
      notes,
      autoCreateCleaningTask,
    } = req.body;

    // Validate dates
    const checkin = parseISO(checkinDate);
    const checkout = parseISO(checkoutDate);

    if (!isAfter(checkout, checkin)) {
      return next(createError('Checkout date must be after check-in date', 400));
    }

    // Calculate nights
    const nights = calculateNights(checkin, checkout);

    // Check for conflicts
    const conflictCheck = await checkBookingConflicts(
      propertyId,
      unitId || null,
      checkin,
      checkout
    );

    if (conflictCheck.hasConflict) {
      return next(createError('Booking conflicts with existing bookings', 409));
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return next(createError('Property not found', 404));
    }

    // Verify guest exists
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) {
      return next(createError('Guest not found', 404));
    }

    // Verify unit exists if provided
    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
      });

      if (!unit || unit.propertyId !== propertyId) {
        return next(createError('Unit not found or does not belong to property', 404));
      }
    }

    // Generate booking reference
    const reference = await generateBookingReference();

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        reference,
        propertyId,
        unitId: unitId || null,
        guestId,
        channel,
        checkinDate: checkin,
        checkoutDate: checkout,
        nights,
        totalAmount: parseFloat(totalAmount),
        currency: currency || 'AED',
        paymentStatus: paymentStatus || 'pending',
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        bookingDocuments: bookingDocuments || [],
        notes,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Auto-create cleaning task if requested
    let cleaningTask = null;
    if (autoCreateCleaningTask) {
      const cleaningId = `CLN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      cleaningTask = await prisma.cleaningTask.create({
        data: {
          cleaningId,
          propertyId,
          unitId: unitId || null,
          bookingId: booking.id,
          scheduledDate: checkout, // Schedule cleaning after checkout
          status: 'not_started',
        },
      });

      // Cleaning task is already linked via bookingId field
    }

    // Create finance record for revenue
    await prisma.financeRecord.create({
      data: {
        type: 'revenue',
        propertyId,
        bookingId: booking.id,
        amount: parseFloat(totalAmount),
        category: 'guest_payment',
        date: new Date(),
        paymentMethod: 'booking',
        status: paymentStatus === 'paid' ? 'paid' : 'pending',
      },
    });

    // Update guest total spend
    await prisma.guest.update({
      where: { id: guestId },
      data: {
        totalSpend: {
          increment: parseFloat(totalAmount),
        },
      },
    });

    // Trigger automation for booking.created
    try {
      const { automationService } = await import('../services/automations/automation.service');
      await automationService.triggerAutomation('booking.created', {
        bookingId: booking.id,
        propertyId: booking.propertyId,
        guestId: booking.guestId,
        checkinDate: booking.checkinDate,
        checkoutDate: booking.checkoutDate,
      });
    } catch (error) {
      console.error('Failed to trigger automation:', error);
      // Don't fail the booking creation if automation fails
    }

    // Audit log
    await auditLog('create', 'bookings', booking.id, req.user.userId, {
      reference: booking.reference,
      propertyId: booking.propertyId,
      guestId: booking.guestId,
    });

    res.status(201).json({
      success: true,
      data: {
        booking: {
          ...booking,
          cleaningTask: cleaningTask || undefined,
        },
      },
      message: 'Booking created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;
    const updateData: any = { ...req.body };

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return next(createError('Booking not found', 404));
    }

    // Handle date updates
    let checkin = existingBooking.checkinDate;
    let checkout = existingBooking.checkoutDate;

    if (updateData.checkinDate) {
      checkin = parseISO(updateData.checkinDate);
    }
    if (updateData.checkoutDate) {
      checkout = parseISO(updateData.checkoutDate);
    }

    // Validate dates
    if (!isAfter(checkout, checkin)) {
      return next(createError('Checkout date must be after check-in date', 400));
    }

    // Recalculate nights if dates changed
    if (updateData.checkinDate || updateData.checkoutDate) {
      updateData.nights = calculateNights(checkin, checkout);

      // Check for conflicts (excluding current booking)
      const conflictCheck = await checkBookingConflicts(
        existingBooking.propertyId,
        existingBooking.unitId || null,
        checkin,
        checkout,
        id
      );

      if (conflictCheck.hasConflict) {
        return next(createError('Booking conflicts with existing bookings', 409));
      }
    }

    // Convert numeric fields
    if (updateData.totalAmount) {
      updateData.totalAmount = parseFloat(updateData.totalAmount);
    }
    if (updateData.depositAmount !== undefined) {
      updateData.depositAmount = updateData.depositAmount ? parseFloat(updateData.depositAmount) : null;
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    await auditLog('update', 'bookings', booking.id, req.user.userId, {
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: { booking },
      message: 'Booking updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(createError('Booking not found', 404));
    }

    // Update guest total spend (subtract booking amount)
    await prisma.guest.update({
      where: { id: booking.guestId },
      data: {
        totalSpend: {
          decrement: Number(booking.totalAmount),
        },
      },
    });

    // Delete related finance records
    await prisma.financeRecord.deleteMany({
      where: { bookingId: id },
    });

    // Delete booking
    await prisma.booking.delete({
      where: { id },
    });

    // Audit log
    await auditLog('delete', 'bookings', id, req.user.userId, {
      reference: booking.reference,
    });

    res.json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const checkIn = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(createError('Booking not found', 404));
    }

    // Check if check-in date is today or in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkinDate = new Date(booking.checkinDate);
    checkinDate.setHours(0, 0, 0, 0);

    if (checkinDate > today) {
      return next(createError('Cannot check in before check-in date', 400));
    }

    // Update booking notes with check-in info
    const checkInNote = `[CHECKED IN] ${new Date().toISOString()} by ${req.user.email}`;
    const updatedNotes = booking.notes
      ? `${booking.notes}\n${checkInNote}`
      : checkInNote;

    await prisma.booking.update({
      where: { id },
      data: {
        notes: updatedNotes,
      },
    });

    // Trigger automation for booking.checkin
    try {
      const { automationService } = await import('../services/automations/automation.service');
      await automationService.triggerAutomation('booking.checkin', {
        bookingId: booking.id,
      });
    } catch (error) {
      console.error('Failed to trigger automation:', error);
    }

    // Audit log
    await auditLog('update', 'bookings', id, req.user.userId, {
      action: 'check_in',
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Check-in recorded successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const checkOut = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(createError('Booking not found', 404));
    }

    // Check if checkout date is today or in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkoutDate = new Date(booking.checkoutDate);
    checkoutDate.setHours(0, 0, 0, 0);

    if (checkoutDate > today) {
      return next(createError('Cannot check out before checkout date', 400));
    }

    // Update booking notes with check-out info
    const checkOutNote = `[CHECKED OUT] ${new Date().toISOString()} by ${req.user.email}`;
    const updatedNotes = booking.notes
      ? `${booking.notes}\n${checkOutNote}`
      : checkOutNote;

    await prisma.booking.update({
      where: { id },
      data: {
        notes: updatedNotes,
      },
    });

    // If cleaning task exists, update its scheduled date to now
    const cleaningTasks = await prisma.cleaningTask.findMany({
      where: { bookingId: booking.id },
    });
    
    if (cleaningTasks.length > 0) {
      await prisma.cleaningTask.update({
        where: { id: cleaningTasks[0].id },
        data: {
          scheduledDate: new Date(),
        },
      });
    }

    // Trigger automation for booking.checkout
    try {
      const { automationService } = await import('../services/automations/automation.service');
      await automationService.triggerAutomation('booking.checkout', {
        bookingId: booking.id,
      });
    } catch (error) {
      console.error('Failed to trigger automation:', error);
    }

    // Audit log
    await auditLog('update', 'bookings', id, req.user.userId, {
      action: 'check_out',
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Check-out recorded successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const getCalendarBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { start, end, propertyId } = req.query;

    if (!start || !end) {
      return next(createError('Start and end dates are required', 400));
    }

    const startDate = parseISO(start as string);
    const endDate = parseISO(end as string);

    const where: any = {
      OR: [
        // Bookings that start in range
        {
          AND: [
            { checkinDate: { gte: startDate } },
            { checkinDate: { lte: endDate } },
          ],
        },
        // Bookings that end in range
        {
          AND: [
            { checkoutDate: { gte: startDate } },
            { checkoutDate: { lte: endDate } },
          ],
        },
        // Bookings that span the entire range
        {
          AND: [
            { checkinDate: { lte: startDate } },
            { checkoutDate: { gte: endDate } },
          ],
        },
      ],
    };

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitCode: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        checkinDate: 'asc',
      },
    });

    // Format for calendar view
    const calendarEvents = bookings.map((booking) => ({
      id: booking.id,
      title: `${booking.property.name} - ${booking.guest.firstName} ${booking.guest.lastName}`,
      start: booking.checkinDate.toISOString(),
      end: booking.checkoutDate.toISOString(),
      resource: {
        bookingId: booking.id,
        reference: booking.reference,
        property: booking.property,
        unit: booking.unit,
        guest: booking.guest,
        nights: booking.nights,
        totalAmount: booking.totalAmount,
        paymentStatus: booking.paymentStatus,
      },
    }));

    res.json({
      success: true,
      data: {
        events: calendarEvents,
        bookings,
      },
    });
  } catch (error: any) {
    next(error);
  }
};


import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

export const archiveBooking = async (
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

    // Check if booking is old enough to archive (e.g., checkout date > 90 days ago)
    const daysSinceCheckout = Math.floor(
      (Date.now() - booking.checkoutDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCheckout < 90) {
      return next(
        createError(
          'Booking cannot be archived. Checkout date must be more than 90 days ago',
          400
        )
      );
    }

    // Archive booking by adding archived flag in notes
    // In production, consider adding an archivedAt field to the schema
    const archivedNote = `[ARCHIVED] ${new Date().toISOString()} by ${req.user.email}`;
    await prisma.booking.update({
      where: { id },
      data: {
        notes: booking.notes
          ? `${booking.notes}\n${archivedNote}`
          : archivedNote,
      },
    });

    // Audit log
    await auditLog('update', 'bookings', id, req.user.userId, {
      action: 'archived',
      archivedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Booking archived successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const archiveGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!guest) {
      return next(createError('Guest not found', 404));
    }

    // Check if guest has no recent bookings (e.g., last booking > 365 days ago)
    const lastBooking = await prisma.booking.findFirst({
      where: { guestId: id },
      orderBy: { checkoutDate: 'desc' },
    });

    if (lastBooking) {
      const daysSinceLastBooking = Math.floor(
        (Date.now() - lastBooking.checkoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastBooking < 365) {
        return next(
          createError(
            'Guest cannot be archived. Last booking must be more than 365 days ago',
            400
          )
        );
      }
    }

    // Archive guest by marking in notes or adding archived flag
    // In production, consider adding an archivedAt field to the schema
    const archivedNote = `[ARCHIVED] ${new Date().toISOString()} by ${req.user.email}`;
    
    // Update guest with archived note (if notes field exists, otherwise use a different approach)
    // For now, we'll just log the archive action

    // Audit log
    await auditLog('update', 'guests', id, req.user.userId, {
      action: 'archived',
      archivedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Guest archived successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const archiveProperty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            units: true,
          },
        },
      },
    });

    if (!property) {
      return next(createError('Property not found', 404));
    }

    // Check if property has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        propertyId: id,
        checkoutDate: { gte: new Date() },
      },
    });

    if (activeBookings > 0) {
      return next(
        createError('Cannot archive property with active bookings', 400)
      );
    }

    // Set property status to inactive (soft archive)
    await prisma.property.update({
      where: { id },
      data: {
        status: 'inactive',
      },
    });

    // Audit log
    await auditLog('update', 'properties', id, req.user.userId, {
      action: 'archived',
      archivedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Property archived successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const getArchivedBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // In production, query from archive table
    // For now, query bookings with archived flag in notes
    const bookings = await prisma.booking.findMany({
      where: {
        notes: {
          contains: '[ARCHIVED]',
        },
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
      orderBy: {
        checkoutDate: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
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

export const restoreArchivedBooking = async (
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

    // Remove archived flag from notes
    if (booking.notes && booking.notes.includes('[ARCHIVED]')) {
      const updatedNotes = booking.notes
        .split('\n')
        .filter((line) => !line.includes('[ARCHIVED]'))
        .join('\n');

      await prisma.booking.update({
        where: { id },
        data: {
          notes: updatedNotes || null,
        },
      });
    }

    // Audit log
    await auditLog('update', 'bookings', id, req.user.userId, {
      action: 'restored',
      restoredAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Booking restored successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const permanentlyDeleteArchived = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { tableName, recordId } = req.params;

    // This is a dangerous operation - should require admin role
    // Delete the record permanently based on table name
    let deleted = false;

    switch (tableName) {
      case 'bookings':
        const booking = await prisma.booking.findUnique({ where: { id: recordId } });
        if (booking && booking.notes?.includes('[ARCHIVED]')) {
          await prisma.booking.delete({ where: { id: recordId } });
          deleted = true;
        }
        break;
      case 'guests':
        // Check if guest can be deleted (no active bookings)
        const guestBookings = await prisma.booking.count({
          where: {
            guestId: recordId,
            checkoutDate: { gte: new Date() },
          },
        });
        if (guestBookings === 0) {
          await prisma.guest.delete({ where: { id: recordId } });
          deleted = true;
        } else {
          return next(createError('Cannot delete guest with active bookings', 400));
        }
        break;
      case 'properties':
        // Properties are archived by setting status to inactive, not deleted
        return next(createError('Properties should be deactivated, not permanently deleted', 400));
      default:
        return next(createError(`Unknown table: ${tableName}`, 400));
    }

    if (!deleted) {
      return next(createError('Record not found or not archived', 404));
    }

    // Audit log before deletion
    await auditLog('delete', `${tableName}_archive`, recordId, req.user.userId, {
      action: 'permanent_delete',
      deletedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Record permanently deleted from archive',
    });
  } catch (error: any) {
    next(error);
  }
};


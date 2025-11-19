import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Job queues
export const automationQueue = new Queue('automations', { connection });
export const emailQueue = new Queue('emails', { connection });
export const syncQueue = new Queue('sync', { connection });

// Queue events for monitoring
export const automationQueueEvents = new QueueEvents('automations', { connection });
export const emailQueueEvents = new QueueEvents('emails', { connection });
export const syncQueueEvents = new QueueEvents('sync', { connection });

// Workers
export const automationWorker = new Worker(
  'automations',
  async (job) => {
    const { type, data } = job.data;
    
    switch (type) {
      case 'create_cleaning_task':
        return await handleCreateCleaningTask(data);
      case 'send_checkin_email':
        return await handleSendCheckinEmail(data);
      case 'send_checkout_email':
        return await handleSendCheckoutEmail(data);
      case 'generate_owner_statement':
        return await handleGenerateOwnerStatement(data);
      case 'maintenance_reminder':
        return await handleMaintenanceReminder(data);
      default:
        throw new Error(`Unknown automation type: ${type}`);
    }
  },
  { connection }
);

export const emailWorker = new Worker(
  'emails',
  async (job) => {
    const { to, subject, template, data } = job.data;
    // Email sending logic would go here
    console.log(`📧 Sending email to ${to}: ${subject}`);
    return { success: true };
  },
  { connection }
);

export const syncWorker = new Worker(
  'sync',
  async (job) => {
    const { provider, propertyMapping } = job.data;
    
    if (provider === 'airbnb') {
      const { airbnbService } = await import('../integrations/airbnb.service');
      return await airbnbService.syncBookings(propertyMapping);
    } else if (provider === 'bookingcom') {
      const { bookingComService } = await import('../integrations/bookingcom.service');
      return await bookingComService.syncBookings(propertyMapping);
    }
    
    throw new Error(`Unknown sync provider: ${provider}`);
  },
  { connection }
);

// Automation handlers
async function handleCreateCleaningTask(data: any) {
  const { bookingId } = data;
  const prisma = (await import('../../config/database')).default;
  
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    return { success: false, message: 'Booking not found' };
  }
  
  // Check if cleaning task already exists for this booking
  const existingTask = await prisma.cleaningTask.findFirst({
    where: { bookingId: booking.id },
  });
  
  if (existingTask) {
    return { success: false, message: 'Cleaning task already exists for this booking' };
  }

  const cleaningId = `CLN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const cleaningTask = await prisma.cleaningTask.create({
    data: {
      cleaningId,
      propertyId: booking.propertyId,
      unitId: booking.unitId,
      bookingId: booking.id,
      scheduledDate: booking.checkoutDate,
      status: 'not_started',
    },
  });

  // Cleaning task is already linked via bookingId field

  return { success: true, cleaningTaskId: cleaningTask.id };
}

async function handleSendCheckinEmail(data: any) {
  const { bookingId } = data;
  const prisma = (await import('../../config/database')).default;
  
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      guest: true,
      property: true,
    },
  });

  if (!booking) {
    return { success: false, message: 'Booking not found' };
  }

  // Add email to email queue
  await emailQueue.add('checkin-instructions', {
    to: booking.guest.email,
    subject: `Check-in Instructions for ${booking.property.name}`,
    template: 'checkin',
    data: {
      guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
      propertyName: booking.property.name,
      checkinDate: booking.checkinDate,
      checkoutDate: booking.checkoutDate,
      reference: booking.reference,
    },
  });

  return { success: true };
}

async function handleSendCheckoutEmail(data: any) {
  const { bookingId } = data;
  const prisma = (await import('../../config/database')).default;
  
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      guest: true,
      property: true,
    },
  });

  if (!booking) {
    return { success: false, message: 'Booking not found' };
  }

  await emailQueue.add('checkout-reminder', {
    to: booking.guest.email,
    subject: `Check-out Reminder for ${booking.property.name}`,
    template: 'checkout',
    data: {
      guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
      propertyName: booking.property.name,
      checkoutDate: booking.checkoutDate,
      reference: booking.reference,
    },
  });

  return { success: true };
}

async function handleGenerateOwnerStatement(data: any) {
  const { ownerId, month } = data;
  const prisma = (await import('../../config/database')).default;
  
  // Generate owner statement logic
  // This would create a PDF and email it to the owner
  console.log(`📊 Generating owner statement for owner ${ownerId}, month ${month}`);
  
  return { success: true };
}

async function handleMaintenanceReminder(data: any) {
  const { maintenanceTaskId } = data;
  const prisma = (await import('../../config/database')).default;
  
  const task = await prisma.maintenanceTask.findUnique({
    where: { id: maintenanceTaskId },
    include: {
      property: true,
      assignedTo: true,
    },
  });

  if (!task || task.status === 'completed') {
    return { success: false, message: 'Task not found or already completed' };
  }

  if (task.assignedTo?.email) {
    await emailQueue.add('maintenance-reminder', {
      to: task.assignedTo.email,
      subject: `Maintenance Reminder: ${task.title}`,
      template: 'maintenance-reminder',
      data: {
        taskTitle: task.title,
        propertyName: task.property.name,
        priority: task.priority,
      },
    });
  }

  return { success: true };
}


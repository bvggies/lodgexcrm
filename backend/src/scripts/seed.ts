import { PrismaClient, StaffRole } from '@prisma/client';
import { hashPassword } from '../utils/auth';
import prisma from '../config/database';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lodgexcrm.com' },
    update: {},
    create: {
      email: 'admin@lodgexcrm.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: StaffRole.admin,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample owners
  const owner1 = await prisma.owner.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+971501234567',
      paymentMethod: 'Bank Transfer',
    },
  });

  const owner2 = await prisma.owner.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+971507654321',
      paymentMethod: 'PayPal',
    },
  });

  const owner3 = await prisma.owner.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Ahmed Al-Mansoori',
      email: 'ahmed@example.com',
      phone: '+971509876543',
      paymentMethod: 'Bank Transfer',
    },
  });

  console.log('✅ Created 3 owners');

  // Create sample properties
  const property1 = await prisma.property.upsert({
    where: { code: 'PROP-001' },
    update: {},
    create: {
      name: 'Luxury Studio Downtown',
      code: 'PROP-001',
      unitType: 'Studio',
      address: {
        street: '123 Business Bay',
        city: 'Dubai',
        country: 'UAE',
        zipCode: '00000',
      },
      locationLat: 25.1972,
      locationLng: 55.2744,
      ownerId: owner1.id,
      status: 'active',
      dewaNumber: 'DEWA-12345',
      dtcmPermitNumber: 'DTCM-67890',
      amenities: ['WiFi', 'AC', 'Kitchen', 'Parking'],
    },
  });

  const property2 = await prisma.property.upsert({
    where: { code: 'PROP-002' },
    update: {},
    create: {
      name: 'Modern 1BR Apartment',
      code: 'PROP-002',
      unitType: '1BR',
      address: {
        street: '456 Marina Walk',
        city: 'Dubai',
        country: 'UAE',
        zipCode: '00001',
      },
      locationLat: 25.0767,
      locationLng: 55.1394,
      ownerId: owner2.id,
      status: 'active',
      dewaNumber: 'DEWA-23456',
      dtcmPermitNumber: 'DTCM-78901',
      amenities: ['WiFi', 'AC', 'Kitchen', 'Balcony', 'Gym'],
    },
  });

  const property3 = await prisma.property.upsert({
    where: { code: 'PROP-003' },
    update: {},
    create: {
      name: 'Beachfront Villa',
      code: 'PROP-003',
      unitType: 'Villa',
      address: {
        street: '789 Palm Jumeirah',
        city: 'Dubai',
        country: 'UAE',
        zipCode: '00002',
      },
      locationLat: 25.1127,
      locationLng: 55.1390,
      ownerId: owner3.id,
      status: 'active',
      dewaNumber: 'DEWA-34567',
      dtcmPermitNumber: 'DTCM-89012',
      amenities: ['WiFi', 'AC', 'Kitchen', 'Pool', 'Beach Access', 'Parking'],
    },
  });

  const property4 = await prisma.property.upsert({
    where: { code: 'PROP-004' },
    update: {},
    create: {
      name: 'City Center Studio',
      code: 'PROP-004',
      unitType: 'Studio',
      address: {
        street: '321 Sheikh Zayed Road',
        city: 'Dubai',
        country: 'UAE',
        zipCode: '00003',
      },
      locationLat: 25.2048,
      locationLng: 55.2708,
      ownerId: owner1.id,
      status: 'active',
      dewaNumber: 'DEWA-45678',
      dtcmPermitNumber: 'DTCM-90123',
      amenities: ['WiFi', 'AC', 'Kitchen'],
    },
  });

  const property5 = await prisma.property.upsert({
    where: { code: 'PROP-005' },
    update: {},
    create: {
      name: 'Executive 2BR Suite',
      code: 'PROP-005',
      unitType: '2BR',
      address: {
        street: '654 DIFC',
        city: 'Dubai',
        country: 'UAE',
        zipCode: '00004',
      },
      locationLat: 25.2206,
      locationLng: 55.2778,
      ownerId: owner2.id,
      status: 'active',
      dewaNumber: 'DEWA-56789',
      dtcmPermitNumber: 'DTCM-01234',
      amenities: ['WiFi', 'AC', 'Kitchen', 'Balcony', 'Gym', 'Pool'],
    },
  });

  console.log('✅ Created 5 properties');

  // Create sample guests
  const guest1 = await prisma.guest.create({
    data: {
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@example.com',
      phone: '+1234567890',
      nationality: 'US',
      totalSpend: 2500.00,
    },
  });

  const guest2 = await prisma.guest.create({
    data: {
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@example.com',
      phone: '+447700900123',
      nationality: 'UK',
      totalSpend: 1800.00,
    },
  });

  const guest3 = await prisma.guest.create({
    data: {
      firstName: 'David',
      lastName: 'Lee',
      email: 'david.lee@example.com',
      phone: '+8613800138000',
      nationality: 'CN',
      totalSpend: 3200.00,
    },
  });

  const guest4 = await prisma.guest.create({
    data: {
      firstName: 'Sophie',
      lastName: 'Martin',
      email: 'sophie.martin@example.com',
      phone: '+33123456789',
      nationality: 'FR',
      totalSpend: 1500.00,
    },
  });

  const guest5 = await prisma.guest.create({
    data: {
      firstName: 'James',
      lastName: 'Taylor',
      email: 'james.taylor@example.com',
      phone: '+61412345678',
      nationality: 'AU',
      totalSpend: 2100.00,
    },
  });

  console.log('✅ Created 5 guests');

  // Create sample bookings
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const booking1 = await prisma.booking.create({
    data: {
      reference: 'BK-001',
      propertyId: property1.id,
      guestId: guest1.id,
      channel: 'airbnb',
      checkinDate: now,
      checkoutDate: nextWeek,
      nights: 7,
      totalAmount: 1200.00,
      currency: 'AED',
      paymentStatus: 'paid',
      depositAmount: 300.00,
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      reference: 'BK-002',
      propertyId: property2.id,
      guestId: guest2.id,
      channel: 'booking_com',
      checkinDate: nextWeek,
      checkoutDate: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
      nights: 5,
      totalAmount: 1500.00,
      currency: 'AED',
      paymentStatus: 'pending',
      depositAmount: 500.00,
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      reference: 'BK-003',
      propertyId: property3.id,
      guestId: guest3.id,
      channel: 'direct',
      checkinDate: nextMonth,
      checkoutDate: new Date(nextMonth.getTime() + 10 * 24 * 60 * 60 * 1000),
      nights: 10,
      totalAmount: 3500.00,
      currency: 'AED',
      paymentStatus: 'partial',
      depositAmount: 1000.00,
    },
  });

  const booking4 = await prisma.booking.create({
    data: {
      reference: 'BK-004',
      propertyId: property1.id,
      guestId: guest4.id,
      channel: 'airbnb',
      checkinDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      checkoutDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      nights: 7,
      totalAmount: 1100.00,
      currency: 'AED',
      paymentStatus: 'paid',
    },
  });

  const booking5 = await prisma.booking.create({
    data: {
      reference: 'BK-005',
      propertyId: property4.id,
      guestId: guest5.id,
      channel: 'direct',
      checkinDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      checkoutDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      nights: 3,
      totalAmount: 450.00,
      currency: 'AED',
      paymentStatus: 'pending',
    },
  });

  const booking6 = await prisma.booking.create({
    data: {
      reference: 'BK-006',
      propertyId: property2.id,
      guestId: guest1.id,
      channel: 'booking_com',
      checkinDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      checkoutDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      nights: 5,
      totalAmount: 1400.00,
      currency: 'AED',
      paymentStatus: 'paid',
    },
  });

  const booking7 = await prisma.booking.create({
    data: {
      reference: 'BK-007',
      propertyId: property5.id,
      guestId: guest2.id,
      channel: 'airbnb',
      checkinDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      checkoutDate: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
      nights: 7,
      totalAmount: 2100.00,
      currency: 'AED',
      paymentStatus: 'paid',
    },
  });

  const booking8 = await prisma.booking.create({
    data: {
      reference: 'BK-008',
      propertyId: property3.id,
      guestId: guest3.id,
      channel: 'direct',
      checkinDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      checkoutDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      nights: 5,
      totalAmount: 2800.00,
      currency: 'AED',
      paymentStatus: 'pending',
    },
  });

  console.log('✅ Created 8 bookings');

  // Create staff users
  const assistantPassword = await hashPassword('assistant123');
  const cleanerPassword = await hashPassword('cleaner123');
  const maintenancePassword = await hashPassword('maintenance123');

  const assistant = await prisma.user.create({
    data: {
      email: 'assistant@lodgexcrm.com',
      passwordHash: assistantPassword,
      firstName: 'Assistant',
      lastName: 'User',
      role: StaffRole.assistant,
    },
  });

  const cleaner = await prisma.user.create({
    data: {
      email: 'cleaner@lodgexcrm.com',
      passwordHash: cleanerPassword,
      firstName: 'Cleaner',
      lastName: 'User',
      role: StaffRole.cleaner,
    },
  });

  const maintenance = await prisma.user.create({
    data: {
      email: 'maintenance@lodgexcrm.com',
      passwordHash: maintenancePassword,
      firstName: 'Maintenance',
      lastName: 'User',
      role: StaffRole.maintenance,
    },
  });

  console.log('✅ Created staff users');

  // Create sample cleaning tasks
  const cleaning1 = await prisma.cleaningTask.create({
    data: {
      cleaningId: 'CLN-001',
      propertyId: property1.id,
      bookingId: booking1.id,
      scheduledDate: nextWeek,
      cleanerId: cleaner.id,
      status: 'completed',
      cost: 150.00,
    },
  });

  const cleaning2 = await prisma.cleaningTask.create({
    data: {
      cleaningId: 'CLN-002',
      propertyId: property2.id,
      bookingId: booking2.id,
      scheduledDate: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
      cleanerId: cleaner.id,
      status: 'not_started',
      cost: 200.00,
    },
  });

  console.log('✅ Created 2 cleaning tasks');

  // Create sample maintenance tasks
  const maintenance1 = await prisma.maintenanceTask.create({
    data: {
      title: 'AC Unit Repair',
      propertyId: property1.id,
      description: 'AC not cooling properly',
      type: 'ac',
      priority: 'high',
      assignedToId: maintenance.id,
      status: 'in_progress',
      cost: 300.00,
    },
  });

  const maintenance2 = await prisma.maintenanceTask.create({
    data: {
      title: 'Leaky Faucet',
      propertyId: property2.id,
      description: 'Kitchen faucet leaking',
      type: 'plumbing',
      priority: 'medium',
      assignedToId: maintenance.id,
      status: 'open',
    },
  });

  console.log('✅ Created 2 maintenance tasks');

  // Create sample finance records
  await prisma.financeRecord.createMany({
    data: [
      {
        type: 'revenue',
        propertyId: property1.id,
        bookingId: booking1.id,
        amount: 1200.00,
        category: 'guest_payment',
        date: now,
        paymentMethod: 'Credit Card',
        status: 'paid',
      },
      {
        type: 'expense',
        propertyId: property1.id,
        amount: 150.00,
        category: 'cleaning',
        date: now,
        paymentMethod: 'Cash',
        status: 'paid',
      },
      {
        type: 'expense',
        propertyId: property1.id,
        amount: 300.00,
        category: 'maintenance',
        date: now,
        paymentMethod: 'Bank Transfer',
        status: 'paid',
      },
      {
        type: 'revenue',
        propertyId: property2.id,
        bookingId: booking2.id,
        amount: 1500.00,
        category: 'guest_payment',
        date: nextWeek,
        paymentMethod: 'PayPal',
        status: 'pending',
      },
    ],
  });

  console.log('✅ Created 4 finance records');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Default credentials:');
  console.log('Admin: admin@lodgexcrm.com / admin123');
  console.log('Assistant: assistant@lodgexcrm.com / assistant123');
  console.log('Cleaner: cleaner@lodgexcrm.com / cleaner123');
  console.log('Maintenance: maintenance@lodgexcrm.com / maintenance123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


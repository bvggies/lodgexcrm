/**
 * Script to create test staff and guest user accounts
 * Usage: npx ts-node src/scripts/create-test-users.ts
 */

import { PrismaClient, StaffRole } from '@prisma/client';
import { hashPassword } from '../utils/auth';
import prisma from '../config/database';

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  phone?: string;
  isGuest?: boolean;
  nationality?: string;
}

const testUsers: TestUser[] = [
  // Staff Users
  {
    email: 'assistant@lodgexcrm.com',
    password: 'assistant123',
    firstName: 'John',
    lastName: 'Assistant',
    role: StaffRole.assistant,
    phone: '+971501234567',
  },
  {
    email: 'cleaner@lodgexcrm.com',
    password: 'cleaner123',
    firstName: 'Sarah',
    lastName: 'Cleaner',
    role: StaffRole.cleaner,
    phone: '+971501234568',
  },
  {
    email: 'maintenance@lodgexcrm.com',
    password: 'maintenance123',
    firstName: 'Mike',
    lastName: 'Maintenance',
    role: StaffRole.maintenance,
    phone: '+971501234569',
  },
  {
    email: 'owner@lodgexcrm.com',
    password: 'owner123',
    firstName: 'Emma',
    lastName: 'Owner',
    role: StaffRole.owner_view,
    phone: '+971501234570',
  },
  // Guest Users
  {
    email: 'guest1@example.com',
    password: 'guest123',
    firstName: 'Alice',
    lastName: 'Johnson',
    role: StaffRole.guest,
    phone: '+971501111111',
    isGuest: true,
    nationality: 'US',
  },
  {
    email: 'guest2@example.com',
    password: 'guest123',
    firstName: 'Bob',
    lastName: 'Smith',
    role: StaffRole.guest,
    phone: '+971502222222',
    isGuest: true,
    nationality: 'UK',
  },
  {
    email: 'guest3@example.com',
    password: 'guest123',
    firstName: 'Carol',
    lastName: 'Williams',
    role: StaffRole.guest,
    phone: '+971503333333',
    isGuest: true,
    nationality: 'CA',
  },
];

async function createTestUsers() {
  try {
    console.log('👥 Creating test staff and guest users...\n');

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          console.log(`ℹ️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const passwordHash = await hashPassword(userData.password);

        if (userData.isGuest) {
          // Create guest user - first create or find Guest record
          let guest = await prisma.guest.findFirst({
            where: { email: userData.email },
          });

          if (!guest) {
            guest = await prisma.guest.create({
              data: {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                nationality: userData.nationality,
              },
            });
            console.log(`   ✅ Created Guest record: ${guest.firstName} ${guest.lastName}`);
          }

          // Create user linked to guest
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              passwordHash,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: StaffRole.guest,
              phone: userData.phone,
              guestId: guest.id,
              isActive: true,
            },
          });

          console.log(`✅ Created Guest User: ${user.email}`);
          console.log(`   Name: ${user.firstName} ${user.lastName}`);
          console.log(`   Password: ${userData.password}`);
          console.log(`   Guest ID: ${guest.id}\n`);
        } else {
          // Create staff user
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              passwordHash,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              phone: userData.phone,
              isActive: true,
            },
          });

          console.log(`✅ Created Staff User: ${user.email}`);
          console.log(`   Name: ${user.firstName} ${user.lastName}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   Password: ${userData.password}\n`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
      }
    }

    console.log('✨ Test users creation completed!');
    console.log('\n📋 Summary:');
    console.log('Staff Users:');
    testUsers
      .filter((u) => !u.isGuest)
      .forEach((u) => {
        console.log(`   - ${u.email} (${u.role}) - Password: ${u.password}`);
      });
    console.log('\nGuest Users:');
    testUsers
      .filter((u) => u.isGuest)
      .forEach((u) => {
        console.log(`   - ${u.email} - Password: ${u.password}`);
      });
  } catch (error: any) {
    console.error('❌ Failed to create test users:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();


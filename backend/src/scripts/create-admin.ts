/**
 * Quick script to create an admin user
 * Usage: npx ts-node src/scripts/create-admin.ts
 */

import { PrismaClient, StaffRole } from '@prisma/client';
import { hashPassword } from '../utils/auth';
import prisma from '../config/database';

async function createAdmin() {
  try {
    console.log('🔑 Creating admin user...');

    const email = process.env.ADMIN_EMAIL || 'admin@lodgexcrm.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME || 'User';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update to admin if not already
      if (existingUser.role !== StaffRole.admin) {
        await prisma.user.update({
          where: { email },
          data: { role: StaffRole.admin, isActive: true },
        });
        console.log(`✅ Updated user ${email} to admin role`);
      } else {
        console.log(`ℹ️  User ${email} already exists as admin`);
      }
      await prisma.$disconnect();
      return;
    }

    // Create new admin user
    const passwordHash = await hashPassword(password);
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: StaffRole.admin,
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${admin.role}`);
  } catch (error: any) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


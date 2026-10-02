import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';

async function seedAdmin() {
  const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@eshub.local';
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin1234!';
  const defaultName = 'System Administrator';

  console.log(`Checking for admin user with email: ${defaultEmail}...`);

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: defaultEmail },
        { role: 'ADMIN' }
      ]
    }
  });

  if (existingAdmin) {
    console.log(`Admin account already exists: ${existingAdmin.name} (${existingAdmin.email || 'No email'}, role: ${existingAdmin.role})`);
    if (!existingAdmin.email || !existingAdmin.passwordHash) {
      console.log(`Updating existing admin account with credentials...`);
      const passwordHash = await hashPassword(defaultPassword);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: existingAdmin.email || defaultEmail,
          passwordHash,
          role: 'ADMIN',
          mustChangePassword: true
        }
      });
      console.log(`Updated admin credentials: email=${defaultEmail}, defaultPassword=${defaultPassword}`);
    }
  } else {
    console.log(`Creating default admin user...`);
    const passwordHash = await hashPassword(defaultPassword);
    const admin = await prisma.user.create({
      data: {
        name: defaultName,
        email: defaultEmail,
        passwordHash,
        role: 'ADMIN',
        mustChangePassword: true
      }
    });
    console.log(`Default admin created successfully!`);
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${defaultPassword}`);
    console.log(`Role: ${admin.role}`);
  }

  await prisma.$disconnect();
  process.exit(0);
}

seedAdmin().catch(async (err) => {
  console.error('Error seeding admin user:', err);
  await prisma.$disconnect();
  process.exit(1);
});

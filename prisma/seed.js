const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: adminPassword,
      role: 'Admin',
    },
  });

  const pengurusPassword = await hashPassword('pengurusiom123');
  const pengurusIom = await prisma.user.create({
    data: {
      name: 'Pengurus IOM',
      email: 'iom@gmail.com',
      password: pengurusPassword,
      role: 'Pengurus_IOM',
    },
  });

  const period = await prisma.period.create({
    data: {
      period: 'Period 1',
      start_date: new Date('2025-04-01T08:00:00Z'),
      end_date: new Date('2025-04-30T17:00:00Z'),
      is_current: true,
      is_open: true,
    },
  });

  console.log({ admin, pengurusIom, period });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
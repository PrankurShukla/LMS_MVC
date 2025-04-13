const { PrismaClient, UserRole, UserStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: {
      email: 'admin@lms.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.admin,
      status: UserStatus.approved,
    },
  });

  // Create default teacher user
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@lms.com' },
    update: {},
    create: {
      email: 'teacher@lms.com',
      password: teacherPassword,
      name: 'Teacher User',
      role: UserRole.teacher,
      status: UserStatus.approved,
    },
  });

  // Create default student user
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@lms.com' },
    update: {},
    create: {
      email: 'student@lms.com',
      password: studentPassword,
      name: 'Student User',
      role: UserRole.student,
      status: UserStatus.approved,
    },
  });

  console.log({ admin, teacher, student });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
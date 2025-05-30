const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

const facultyMajorMap = {
  '101': { fakultas: "Fakultas Matematika dan Ilmu Pengetahuan Alam", prodi: "Matematika" },
  '104': { fakultas: "Sekolah Ilmu dan Teknologi Hayati", prodi: "Mikrobiologi" },
  '107': { fakultas: "Sekolah Farmasi", prodi: "Sains dan Teknologi Farmasi" },
  '121': { fakultas: "Fakultas Teknik Pertambangan dan Perminyakan", prodi: "Teknik Pertambangan" },
  '120': { fakultas: "Fakultas Ilmu dan Teknologi Kebumian", prodi: "Teknik Geologi" },
  '130': { fakultas: "Fakultas Teknologi Industri", prodi: "Teknik Kimia" },
  '132': { fakultas: "Sekolah Teknik Elektro dan Informatika", prodi: "Teknik Elektro" },
  '131': { fakultas: "Fakultas Teknik Mesin dan Dirgantara", prodi: "Teknik Mesin" },
};

async function main() {
  // Admin
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: adminPassword,
      role: 'Admin',
    },
  });

  console.log('✅ Seeding admin completed');

  // 19 Pengurus_IOM
  const pengurusPassword = 'pengurusiom123';
  const pengurusHashes = await Promise.all(
    Array.from({ length: 19 }, () => hashPassword(pengurusPassword))
  );

  const pengurusPromises = pengurusHashes.map((password, i) =>
    prisma.user.create({
      data: {
        name: `Pengurus IOM ${i + 1}`,
        email: `pengurus${i + 1}@gmail.com`,
        password,
        role: 'Pengurus_IOM',
      },
    })
  );

  await Promise.all(pengurusPromises);

  console.log('✅ Seeding pengurus completed');

  const pewawancaraPassword = 'pewawancara123';
  const pewawancaraHashes = await Promise.all(
    Array.from({ length: 20 }, () => hashPassword(pewawancaraPassword))
  );

  const pewawancaraPromises = pewawancaraHashes.map((password, i) =>
    prisma.user.create({
      data: {
        name: `Pewawancara ${i + 1}`,
        email: `pewawancara${i + 1}@gmail.com`,
        password,
        role: 'Pewawancara',
      },
    })
  );

  await Promise.all(pewawancaraPromises);

  console.log('✅ Seeding pewawancara completed');

  // 80 Mahasiswa
  const studentPassword = 'mahasiswa123';
  let globalIndex = 1;
  const studentsWithFiles = [];

  for (const key in facultyMajorMap) {
    const { fakultas, prodi } = facultyMajorMap[key];

    for (let i = 1; i <= 10; i++) {
      const hashedPassword = await hashPassword(studentPassword);

      const user = await prisma.user.create({
        data: {
          name: `Mahasiswa ${globalIndex}`,
          email: `mahasiswa${globalIndex}@gmail.com`,
          password: hashedPassword,
          role: 'Mahasiswa',
        },
      });

      const sequence = String(i).padStart(5, '0'); 
      const nim = `${key}${sequence}`; 

      const student = await prisma.student.create({
        data: {
          nim,
          faculty: fakultas,
          major: prodi,
          student_id: user.user_id,
        },
      });

      studentsWithFiles.push({
        student_id: student.student_id,
        globalIndex,
      });

      globalIndex++;
    }
  }

  console.log('✅ Seeding mahasiswa completed');

  // Upload file
  const allStudents = studentsWithFiles;

  // 20 Mahasiswa dengan 1 file telah diupload
  for (let i = 0; i < 20; i++) {
    const student = allStudents[i];
    await prisma.file.create({
      data: {
        student_id: student.student_id,
        file_url: `https://example.com/files/ktp_sample_${student.globalIndex}.pdf`,
        file_name: `KTP_Mahasiswa_${student.globalIndex}.pdf`,
        type: 'KTP',
      },
    });
  }

  // 40 Mahasiswa dengan beberapa file telah diupload
  for (let i = 20; i < 60; i++) {
    const student = allStudents[i];
    const files = [
      {
        type: 'KTP',
        url: `https://example.com/files/ktp_${student.globalIndex}.pdf`,
        name: `KTP_Mahasiswa_${student.globalIndex}.pdf`,
      },
      {
        type: 'CV',
        url: `https://example.com/files/cv_${student.globalIndex}.pdf`,
        name: `CV_Mahasiswa_${student.globalIndex}.pdf`,
      },
      {
        type: 'Transkrip_Nilai',
        url: `https://example.com/files/transkrip_${student.globalIndex}.pdf`,
        name: `Transkrip_Mahasiswa_${student.globalIndex}.pdf`,
      },
    ];

    for (const file of files) {
      await prisma.file.create({
        data: {
          student_id: student.student_id,
          file_url: file.url,
          file_name: file.name,
          type: file.type,
        },
      });
    }
  }

  console.log('✅ Seeding file completed');

  // Periode
  const period = await prisma.period.create({
    data: {
      period: 'Period 1',
      start_date: new Date('2025-04-01T08:00:00Z'),
      end_date: new Date('2025-04-30T17:00:00Z'),
      is_current: true,
      is_open: true,
    },
  });

  console.log('✅ Seeding period completed');

  // Status 70 Mahasiswa
  const periodId = period.period_id;

  for (let i = 0; i < 70; i++) {
    const student = allStudents[i];

    await prisma.status.create({
      data: {
        student_id: student.student_id,
        period_id: periodId,
        passDitmawa: false,
        passIOM: false,
        passInterview: false,
        amount: null,
      },
    });

  }

  console.log('✅ Seeding status completed');

  console.log('✅ Seeding completed successfully');
}

main()
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import prisma from './db';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting health record database seed...');

  // Create default patient account
  const defaultEmail = 'amma@tracker.com';
  const hashedPassword = await bcrypt.hash('amma1234', 10);

  let user = await prisma.user.findUnique({ where: { email: defaultEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Amma (Mother)',
        email: defaultEmail,
        password: hashedPassword,
        age: 65,
        weight: 68.5,
        height: 158,
        diabetesType: 'Type 2',
        targetMin: 70,
        targetMax: 140,
        medicines: JSON.stringify(['Metformin 500mg', 'Glipizide 5mg', 'Lantus Insulin']),
        themeSettings: JSON.stringify({ largeText: true, highContrast: false })
      }
    });
    console.log('Created default user: amma@tracker.com / amma1234');
  } else {
    // Clean old records for clean seed
    await prisma.sugarReading.deleteMany({ where: { userId: user.id } });
    await prisma.bPReading.deleteMany({ where: { userId: user.id } });
    await prisma.weightReading.deleteMany({ where: { userId: user.id } });
    await prisma.medicineReminder.deleteMany({ where: { userId: user.id } });
    await prisma.doctorNote.deleteMany({ where: { userId: user.id } });
    console.log('Cleaned old records for seeding.');
  }

  const userId = user.id;

  // Generate blood sugar readings log spanning the last 120 days
  const readings: any[] = [];
  const today = new Date();
  
  // Reading type helper
  const types = [
    { type: 'fasting', hour: '07:30', baseMin: 80, baseMax: 110, med: true, medName: 'Metformin 500mg' },
    { type: 'after_breakfast', hour: '09:30', baseMin: 110, baseMax: 160, med: false },
    { type: 'after_lunch', hour: '14:30', baseMin: 120, baseMax: 170, med: true, medName: 'Glipizide 5mg' },
    { type: 'bedtime', hour: '21:30', baseMin: 100, baseMax: 140, med: true, medName: 'Lantus Insulin', insulin: 12 }
  ];

  for (let i = 120; i >= 0; i--) {
    const currentDate = new Date();
    currentDate.setDate(today.getDate() - i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // 90% chance of taking readings today
    if (Math.random() > 0.1) {
      // Pick 2-3 random times of day to read
      const numReadings = Math.random() > 0.5 ? 3 : 2;
      const selectedTypes = [...types].sort(() => 0.5 - Math.random()).slice(0, numReadings);

      selectedTypes.forEach((t) => {
        // Occasional spike simulation
        const spike = Math.random() > 0.9 ? 50 : 0;
        const sugar = Math.floor(Math.random() * (t.baseMax - t.baseMin + 1)) + t.baseMin + spike;

        readings.push({
          userId,
          readingDate: dateStr,
          readingTime: t.hour,
          readingType: t.type,
          bloodSugar: sugar,
          medicineTaken: t.med,
          medicineName: t.medName || null,
          insulinUnits: t.insulin || null,
          mealNotes: t.type === 'after_breakfast' ? 'Oatmeal & Almond Milk' : t.type === 'after_lunch' ? 'Brown rice with spinach curry' : null,
          symptoms: spike > 0 ? 'Dizziness, Fatigue' : null,
          remarks: spike > 0 ? 'Missed afternoon walking session' : 'Feeling energetic'
        });
      });
    }
  }

  await prisma.sugarReading.createMany({ data: readings });
  console.log(`Seeded ${readings.length} sugar readings logs.`);

  // Seed blood pressure logs
  const bpLogs: any[] = [];
  for (let i = 30; i >= 0; i -= 3) {
    const currentDate = new Date();
    currentDate.setDate(today.getDate() - i);
    const bpDate = currentDate.toISOString().split('T')[0];

    bpLogs.push({
      userId,
      readingDate: bpDate,
      readingTime: '08:30',
      systolic: Math.floor(Math.random() * (135 - 118 + 1)) + 118,
      diastolic: Math.floor(Math.random() * (85 - 75 + 1)) + 75,
      pulse: Math.floor(Math.random() * (78 - 65 + 1)) + 65,
      remarks: 'Seeded record'
    });
  }
  await prisma.bPReading.createMany({ data: bpLogs });
  console.log(`Seeded ${bpLogs.length} blood pressure logs.`);

  // Seed weight logs
  const weightLogs: any[] = [];
  for (let i = 60; i >= 0; i -= 10) {
    const currentDate = new Date();
    currentDate.setDate(today.getDate() - i);
    const wDate = currentDate.toISOString().split('T')[0];

    weightLogs.push({
      userId,
      readingDate: wDate,
      weight: parseFloat((69 - (60 - i) * 0.02).toFixed(1)),
      bmi: 27.2,
      remarks: 'Recorded weight'
    });
  }
  await prisma.weightReading.createMany({ data: weightLogs });
  console.log(`Seeded ${weightLogs.length} weight entries.`);

  // Seed reminders
  await prisma.medicineReminder.createMany({
    data: [
      { userId, medName: 'Metformin 500mg', dosage: '1 tablet', time: '08:00', remarks: 'Before breakfast' },
      { userId, medName: 'Glipizide 5mg', dosage: '1 tablet', time: '13:00', remarks: 'Before lunch' },
      { userId, medName: 'Lantus Insulin', dosage: '12 units', time: '21:00', remarks: 'Bedtime' }
    ]
  });
  console.log('Seeded medicine reminders.');

  // Seed Doctor visits
  const consultDate = new Date();
  consultDate.setDate(today.getDate() - 15);
  
  const nextVisitDate = new Date();
  nextVisitDate.setDate(today.getDate() + 45);

  await prisma.doctorNote.create({
    data: {
      userId,
      visitDate: consultDate.toISOString().split('T')[0],
      doctorName: 'Dr. Ramesh R. (Endocrinologist)',
      specialty: 'Endocrinology / Diabetology',
      symptoms: 'Mild morning fatigue',
      diagnosis: 'A1c trending downwards. Target range is well maintained.',
      treatment: 'Continue Metformin 500mg & Glipizide 5mg. Adjust insulin if bedtime sugar spikes above 160.',
      nextVisit: nextVisitDate.toISOString().split('T')[0],
      notes: 'Advised 30 minutes light evening walks daily.'
    }
  });
  console.log('Seeded doctor consultation notes.');

  console.log('Seed operations completed successfully.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

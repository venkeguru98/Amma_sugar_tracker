const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const dumpPath = path.join(__dirname, 'prisma/sqlite_dump.json');

if (!fs.existsSync(dumpPath)) {
  console.error("Dump file not found at:", dumpPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

// Check database URL in env
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is missing!");
  process.exit(1);
}

if (process.env.DATABASE_URL.startsWith('file:')) {
  console.error("DATABASE_URL is set to SQLite. Please set DATABASE_URL to your PostgreSQL connection string.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to target database and importing SQLite data...");

  // Import users
  if (data.users && data.users.length > 0) {
    console.log(`Importing ${data.users.length} users...`);
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          password: u.password,
          age: u.age,
          weight: u.weight,
          height: u.height,
          diabetesType: u.diabetes_type,
          medicines: u.medicines,
          targetMin: u.target_min,
          targetMax: u.target_max,
          themeSettings: u.theme_settings,
        },
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          age: u.age,
          weight: u.weight,
          height: u.height,
          diabetesType: u.diabetes_type,
          medicines: u.medicines,
          targetMin: u.target_min,
          targetMax: u.target_max,
          themeSettings: u.theme_settings,
          createdAt: new Date(u.created_at),
          updatedAt: new Date(u.updated_at),
        }
      });
    }
  }

  // Import monitoring plans
  if (data.monitoring_plans && data.monitoring_plans.length > 0) {
    console.log(`Importing ${data.monitoring_plans.length} monitoring plans...`);
    for (const mp of data.monitoring_plans) {
      await prisma.monitoringPlan.upsert({
        where: { id: mp.id },
        update: {
          frequency: mp.frequency,
          scheduleDays: mp.scheduleDays,
          reminderTime: mp.reminder_time,
          readingTypes: mp.readingTypes,
          startDate: mp.start_date,
          endDate: mp.end_date,
          isActive: mp.is_active === 1 || mp.is_active === true,
        },
        create: {
          id: mp.id,
          userId: mp.user_id,
          frequency: mp.frequency,
          scheduleDays: mp.scheduleDays,
          reminderTime: mp.reminder_time,
          readingTypes: mp.readingTypes,
          startDate: mp.start_date,
          endDate: mp.end_date,
          isActive: mp.is_active === 1 || mp.is_active === true,
          createdAt: new Date(mp.created_at),
          updatedAt: new Date(mp.updated_at),
        }
      });
    }
  }

  // Import sugar readings
  if (data.sugar_readings && data.sugar_readings.length > 0) {
    console.log(`Importing ${data.sugar_readings.length} sugar readings...`);
    const sugarData = data.sugar_readings.map(sr => ({
      id: sr.id,
      userId: sr.user_id,
      readingDate: sr.reading_date,
      readingTime: sr.reading_time,
      readingType: sr.reading_type,
      bloodSugar: sr.blood_sugar,
      medicineTaken: sr.medicine_taken === 1 || sr.medicine_taken === true,
      medicineName: sr.medicine_name,
      insulinUnits: sr.insulin_units,
      mealNotes: sr.meal_notes,
      symptoms: sr.symptoms,
      remarks: sr.remarks,
      createdAt: new Date(sr.created_at),
      updatedAt: new Date(sr.updated_at)
    }));

    const userIds = [...new Set(sugarData.map(d => d.userId))];
    for (const uid of userIds) {
      await prisma.sugarReading.deleteMany({ where: { userId: uid } });
    }
    await prisma.sugarReading.createMany({ data: sugarData });
  }

  // BP
  if (data.bp_readings && data.bp_readings.length > 0) {
    console.log(`Importing ${data.bp_readings.length} BP readings...`);
    const bpData = data.bp_readings.map(bp => ({
      id: bp.id,
      userId: bp.user_id,
      readingDate: bp.reading_date,
      readingTime: bp.reading_time,
      systolic: bp.systolic,
      diastolic: bp.diastolic,
      pulse: bp.pulse,
      remarks: bp.remarks,
      createdAt: new Date(bp.created_at),
      updatedAt: new Date(bp.updated_at)
    }));
    const userIds = [...new Set(bpData.map(d => d.userId))];
    for (const uid of userIds) {
      await prisma.bPReading.deleteMany({ where: { userId: uid } });
    }
    await prisma.bPReading.createMany({ data: bpData });
  }

  // Weight
  if (data.weight_readings && data.weight_readings.length > 0) {
    console.log(`Importing ${data.weight_readings.length} weight readings...`);
    const wData = data.weight_readings.map(w => ({
      id: w.id,
      userId: w.user_id,
      readingDate: w.reading_date,
      weight: w.weight,
      bmi: w.bmi,
      remarks: w.remarks,
      createdAt: new Date(w.created_at),
      updatedAt: new Date(w.updated_at)
    }));
    const userIds = [...new Set(wData.map(d => d.userId))];
    for (const uid of userIds) {
      await prisma.weightReading.deleteMany({ where: { userId: uid } });
    }
    await prisma.weightReading.createMany({ data: wData });
  }

  // Medicine Reminders
  if (data.medicine_reminders && data.medicine_reminders.length > 0) {
    console.log(`Importing ${data.medicine_reminders.length} medicine reminders...`);
    const mrData = data.medicine_reminders.map(mr => ({
      id: mr.id,
      userId: mr.user_id,
      medName: mr.med_name,
      dosage: mr.dosage,
      time: mr.time,
      isActive: mr.is_active === 1 || mr.is_active === true,
      remarks: mr.remarks,
      createdAt: new Date(mr.created_at),
      updatedAt: new Date(mr.updated_at)
    }));
    const userIds = [...new Set(mrData.map(d => d.userId))];
    for (const uid of userIds) {
      await prisma.medicineReminder.deleteMany({ where: { userId: uid } });
    }
    await prisma.medicineReminder.createMany({ data: mrData });
  }

  // Doctor Notes
  if (data.doctor_notes && data.doctor_notes.length > 0) {
    console.log(`Importing ${data.doctor_notes.length} doctor notes...`);
    const dnData = data.doctor_notes.map(dn => ({
      id: dn.id,
      userId: dn.user_id,
      visitDate: dn.visit_date,
      doctorName: dn.doctor_name,
      specialty: dn.specialty,
      symptoms: dn.symptoms,
      diagnosis: dn.diagnosis,
      treatment: dn.treatment,
      nextVisit: dn.next_visit,
      notes: dn.notes,
      createdAt: new Date(dn.created_at),
      updatedAt: new Date(dn.updated_at)
    }));
    const userIds = [...new Set(dnData.map(d => d.userId))];
    for (const uid of userIds) {
      await prisma.doctorNote.deleteMany({ where: { userId: uid } });
    }
    await prisma.doctorNote.createMany({ data: dnData });
  }

  // Lab Reports
  if (data.lab_reports && data.lab_reports.length > 0) {
    console.log(`Importing ${data.lab_reports.length} lab reports...`);
    const lrData = data.lab_reports.map(lr => ({
      id: lr.id,
      userId: lr.user_id,
      testDate: lr.test_date,
      reportName: lr.report_name,
      labName: lr.lab_name,
      fileUrl: lr.file_url,
      hba1c: lr.hba1c,
      remarks: lr.remarks,
      createdAt: new Date(lr.created_at),
      updatedAt: new Date(lr.updated_at)
    }));
    const userIds = [...new Set(lrData.map(d => d.userId))];
    for (const uid of userIds) {
      await prisma.labReport.deleteMany({ where: { userId: uid } });
    }
    if (lrData.length > 0) {
      await prisma.labReport.createMany({ data: lrData });
    }
  }

  // Prescriptions
  if (data.prescriptions && data.prescriptions.length > 0) {
    console.log(`Importing ${data.prescriptions.length} prescriptions...`);
    const pData = data.prescriptions.map(p => ({
      id: p.id,
      userId: p.user_id,
      doctorName: p.doctor_name,
      issueDate: p.issue_date,
      fileUrl: p.file_url,
      notes: p.notes,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at)
    }));
    const userIds = [...new Set(pData.map(d => d.userId))];
    for (const uid of userIds) {
      await prisma.prescription.deleteMany({ where: { userId: uid } });
    }
    if (pData.length > 0) {
      await prisma.prescription.createMany({ data: pData });
    }
  }

  console.log("SQLite migration data imported to PostgreSQL successfully!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

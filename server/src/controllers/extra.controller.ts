import { Response } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// --- Blood Pressure (BP) Readings ---
export const getBPReadings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const readings = await prisma.bPReading.findMany({
      where: { userId: req.user.id },
      orderBy: { readingDate: 'desc' }
    });
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBPReading = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { readingDate, readingTime, systolic, diastolic, pulse, remarks } = req.body;

    if (!readingDate || !readingTime || systolic === undefined || diastolic === undefined) {
      return res.status(400).json({ error: 'Date, time, systolic, and diastolic are required' });
    }

    const reading = await prisma.bPReading.create({
      data: {
        userId: req.user.id,
        readingDate,
        readingTime,
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: pulse ? parseInt(pulse) : null,
        remarks: remarks || null
      }
    });
    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBPReading = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    await prisma.bPReading.delete({
      where: { id, userId: req.user.id }
    });
    res.json({ message: 'BP reading deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Weight Tracker ---
export const getWeightReadings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const readings = await prisma.weightReading.findMany({
      where: { userId: req.user.id },
      orderBy: { readingDate: 'desc' }
    });
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createWeightReading = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { readingDate, weight, remarks } = req.body;

    if (!readingDate || weight === undefined) {
      return res.status(400).json({ error: 'Date and weight are required' });
    }

    // Retrieve user height to calculate BMI if height exists
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    let bmi = null;
    if (user && user.height && user.height > 0) {
      // BMI = weight (kg) / height (m)^2
      const heightInMeters = user.height / 100;
      bmi = parseFloat((parseFloat(weight) / (heightInMeters * heightInMeters)).toFixed(2));
    }

    const reading = await prisma.weightReading.create({
      data: {
        userId: req.user.id,
        readingDate,
        weight: parseFloat(weight),
        bmi,
        remarks: remarks || null
      }
    });

    // Also update weight in user profile for quick reference
    await prisma.user.update({
      where: { id: req.user.id },
      data: { weight: parseFloat(weight) }
    });

    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteWeightReading = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    await prisma.weightReading.delete({
      where: { id, userId: req.user.id }
    });
    res.json({ message: 'Weight reading deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Medicine Reminders ---
export const getReminders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const reminders = await prisma.medicineReminder.findMany({
      where: { userId: req.user.id },
      orderBy: { time: 'asc' }
    });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createReminder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { medName, dosage, time, remarks } = req.body;

    if (!medName || !dosage || !time) {
      return res.status(400).json({ error: 'Medicine name, dosage, and time are required' });
    }

    const reminder = await prisma.medicineReminder.create({
      data: {
        userId: req.user.id,
        medName,
        dosage,
        time,
        remarks: remarks || null
      }
    });
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleReminder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { isActive } = req.body;

    const reminder = await prisma.medicineReminder.update({
      where: { id, userId: req.user.id },
      data: { isActive: isActive === true }
    });
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteReminder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    await prisma.medicineReminder.delete({
      where: { id, userId: req.user.id }
    });
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Doctor Notes ---
export const getDoctorNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const notes = await prisma.doctorNote.findMany({
      where: { userId: req.user.id },
      orderBy: { visitDate: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDoctorNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { visitDate, doctorName, specialty, symptoms, diagnosis, treatment, nextVisit, notes } = req.body;

    if (!visitDate || !doctorName) {
      return res.status(400).json({ error: 'Visit date and doctor name are required' });
    }

    const note = await prisma.doctorNote.create({
      data: {
        userId: req.user.id,
        visitDate,
        doctorName,
        specialty: specialty || null,
        symptoms: symptoms || null,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        nextVisit: nextVisit || null,
        notes: notes || null
      }
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDoctorNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    await prisma.doctorNote.delete({
      where: { id, userId: req.user.id }
    });
    res.json({ message: 'Doctor note deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Laboratory Reports ---
export const getLabReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const reports = await prisma.labReport.findMany({
      where: { userId: req.user.id },
      orderBy: { testDate: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createLabReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { testDate, reportName, labName, hba1c, remarks } = req.body;
    const file = req.file;

    if (!testDate || !reportName || !file) {
      return res.status(400).json({ error: 'Test date, report name, and PDF/image file are required' });
    }

    const report = await prisma.labReport.create({
      data: {
        userId: req.user.id,
        testDate,
        reportName,
        labName: labName || null,
        hba1c: hba1c ? parseFloat(hba1c) : null,
        remarks: remarks || null,
        fileUrl: `/uploads/${file.filename}`
      }
    });
    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteLabReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    await prisma.labReport.delete({
      where: { id, userId: req.user.id }
    });
    res.json({ message: 'Lab report deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Prescriptions ---
export const getPrescriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const prescriptions = await prisma.prescription.findMany({
      where: { userId: req.user.id },
      orderBy: { issueDate: 'desc' }
    });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPrescription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { doctorName, issueDate, notes } = req.body;
    const file = req.file;

    if (!doctorName || !issueDate || !file) {
      return res.status(400).json({ error: 'Doctor name, issue date, and prescription image/document are required' });
    }

    const prescription = await prisma.prescription.create({
      data: {
        userId: req.user.id,
        doctorName,
        issueDate,
        notes: notes || null,
        fileUrl: `/uploads/${file.filename}`
      }
    });
    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePrescription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    await prisma.prescription.delete({
      where: { id, userId: req.user.id }
    });
    res.json({ message: 'Prescription deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

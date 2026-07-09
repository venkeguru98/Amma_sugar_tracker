import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  getBPReadings, createBPReading, deleteBPReading,
  getWeightReadings, createWeightReading, deleteWeightReading,
  getReminders, createReminder, toggleReminder, deleteReminder,
  getDoctorNotes, createDoctorNote, deleteDoctorNote,
  getLabReports, createLabReport, deleteLabReport,
  getPrescriptions, createPrescription, deletePrescription
} from '../controllers/extra.controller';
import {
  getPlan, savePlan, getProgress
} from '../controllers/monitoring.controller';

const router = Router();
router.use(authenticateToken);

// Configure Multer for local storage upload
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// BP Routes
router.get('/bp', getBPReadings);
router.post('/bp', createBPReading);
router.delete('/bp/:id', deleteBPReading);

// Weight Routes
router.get('/weight', getWeightReadings);
router.post('/weight', createWeightReading);
router.delete('/weight/:id', deleteWeightReading);

// Reminders Routes
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.put('/reminders/:id/toggle', toggleReminder);
router.delete('/reminders/:id', deleteReminder);

// Doctor Notes Routes
router.get('/doctor-notes', getDoctorNotes);
router.post('/doctor-notes', createDoctorNote);
router.delete('/doctor-notes/:id', deleteDoctorNote);

// Lab Reports Routes
router.get('/lab-reports', getLabReports);
router.post('/lab-reports', upload.single('file'), createLabReport);
router.delete('/lab-reports/:id', deleteLabReport);

// Prescriptions Routes
router.get('/prescriptions', getPrescriptions);
router.post('/prescriptions', upload.single('file'), createPrescription);
router.delete('/prescriptions/:id', deletePrescription);

// Monitoring Plan Routes
router.get('/monitoring-plan', getPlan);
router.post('/monitoring-plan', savePlan);
router.get('/monitoring-plan/progress', getProgress);

export default router;

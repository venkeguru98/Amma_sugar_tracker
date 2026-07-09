import { Router } from 'express';
import { exportCSV, exportExcel, exportPDF } from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/csv', exportCSV);
router.get('/excel', exportExcel);
router.get('/pdf', exportPDF);

export default router;

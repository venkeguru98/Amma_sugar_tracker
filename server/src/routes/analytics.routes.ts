import { Router } from 'express';
import { getDashboardAnalytics, getDeepAnalytics } from '../controllers/analytics.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardAnalytics);
router.get('/deep', getDeepAnalytics);

export default router;

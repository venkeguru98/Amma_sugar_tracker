import { Router } from 'express';
import { createReading, updateReading, deleteReading, getReading, getReadings } from '../controllers/reading.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createReading);
router.get('/', getReadings);
router.get('/:id', getReading);
router.put('/:id', updateReading);
router.delete('/:id', deleteReading);

export default router;

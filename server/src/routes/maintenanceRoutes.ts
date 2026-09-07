import { Router } from 'express';
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceStatus
} from '../controllers/maintenanceController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getMaintenanceRecords);
router.post('/', requireRole('ADMIN', 'IT_DEPT'), createMaintenanceRecord);
router.patch('/:id/status', requireRole('ADMIN', 'IT_DEPT'), updateMaintenanceStatus);

export default router;

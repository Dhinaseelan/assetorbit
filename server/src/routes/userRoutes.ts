import { Router } from 'express';
import { getUsers, createEmployeeAccount } from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'IT_DEPT', 'HR_DEPT', 'MANAGER'), getUsers);
router.post('/', requireRole('ADMIN', 'HR_DEPT'), createEmployeeAccount);

export default router;

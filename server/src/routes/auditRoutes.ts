import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'IT_DEPT', 'MANAGER'), getAuditLogs);

export default router;

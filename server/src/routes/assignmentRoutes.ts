import { Router } from 'express';
import { assignAsset, returnAsset, getAssignments } from '../controllers/assignmentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssignments);
router.post('/assign', requireRole('ADMIN', 'IT_DEPT', 'HR_DEPT'), assignAsset);
router.post('/:assignmentId/return', requireRole('ADMIN', 'IT_DEPT', 'HR_DEPT'), returnAsset);

export default router;

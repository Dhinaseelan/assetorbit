import { Router } from 'express';
import { login, registerOrg, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register-org', registerOrg);
router.get('/me', authenticateToken, getMe);

export default router;

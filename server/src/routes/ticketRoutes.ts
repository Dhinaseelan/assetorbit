import { Router } from 'express';
import { getTickets, createTicket, updateTicketStatus } from '../controllers/ticketController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getTickets);
router.post('/', createTicket);
router.patch('/:id/status', requireRole('ADMIN', 'IT_DEPT'), updateTicketStatus);

export default router;

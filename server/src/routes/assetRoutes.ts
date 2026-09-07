import { Router } from 'express';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  retireAsset
} from '../controllers/assetController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssets);
router.get('/:id', getAssetById);
router.post('/', requireRole('ADMIN', 'IT_DEPT'), createAsset);
router.put('/:id', requireRole('ADMIN', 'IT_DEPT', 'HR_DEPT'), updateAsset);
router.delete('/:id', requireRole('ADMIN'), deleteAsset);
router.post('/:id/retire', requireRole('ADMIN', 'IT_DEPT'), retireAsset);

export default router;

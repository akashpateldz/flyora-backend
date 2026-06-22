import { Router } from 'express';
import { submitKyc, getKycStatus, getAdminList, adminAction } from '../controllers/kyc.controller';

const router = Router();

router.post('/submit', submitKyc);
router.get('/status/:userId', getKycStatus);
router.get('/admin/list', getAdminList);
router.post('/admin/action', adminAction);

export default router;

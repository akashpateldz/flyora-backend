import { Router } from 'express';
import {
  getAdminStats,
  getUsersList,
  toggleUserStatus,
  getTripsList,
  getBookingsList,
  getReviewsList,
  getWaitlistList,
  getShipmentsList
} from '../controllers/admin.controller';

const router = Router();

router.get('/stats', getAdminStats);
router.get('/users', getUsersList);
router.put('/users/:id/status', toggleUserStatus);
router.get('/trips', getTripsList);
router.get('/bookings', getBookingsList);
router.get('/reviews', getReviewsList);
router.get('/waitlist', getWaitlistList);
router.get('/shipments', getShipmentsList);

export default router;

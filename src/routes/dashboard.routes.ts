import { Router } from 'express';
import {
  createTrip,
  getUserTrips,
  createShipment,
  getUserShipments,
  getDashboardOverview,
  updateUserProfile
} from '../controllers/dashboard.controller';

const router = Router();

router.post('/trips', createTrip);
router.get('/trips/:userId', getUserTrips);

router.post('/shipments', createShipment);
router.get('/shipments/:userId', getUserShipments);

router.get('/overview/:userId', getDashboardOverview);
router.put('/profile/:userId', updateUserProfile);

export default router;

import { Router } from 'express';
import { joinWaitlist, getWaitlistCount } from '../controllers/waitlist.controller';

const router = Router();

/**
 * @route   POST /api/waitlist
 * @desc    Join Flyora waitlist
 * @body    { email: string, name?: string, role?: 'traveler'|'sender'|'both' }
 * @access  Public
 */
router.post('/', joinWaitlist);

/**
 * @route   GET /api/waitlist/count
 * @desc    Get current waitlist count
 * @access  Public
 */
router.get('/count', getWaitlistCount);

export default router;

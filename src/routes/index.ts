import { Router } from 'express';
import healthRoutes from './health.routes';
import landingRoutes from './landing.routes';
import waitlistRoutes from './waitlist.routes';
import { getStats, getRoutes, getFeatures } from '../controllers/landing.controller';

const router = Router();

// ─── Health ──────────────────────────────────────────────────────────────────
router.use('/health', healthRoutes);

// ─── Full Landing Data ────────────────────────────────────────────────────────
router.use('/landing', landingRoutes);

// ─── Convenience Shortcut Routes ─────────────────────────────────────────────
router.get('/stats', getStats);
router.get('/routes', getRoutes);
router.get('/features', getFeatures);

// ─── Waitlist ─────────────────────────────────────────────────────────────────
router.use('/waitlist', waitlistRoutes);

export default router;

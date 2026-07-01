import { Router } from 'express';
import healthRoutes from './health.routes';
import landingRoutes from './landing.routes';
import waitlistRoutes from './waitlist.routes';
import authRoutes from './auth.routes';
import kycRoutes from './kyc.routes';
import dashboardRoutes from './dashboard.routes';
import adminRoutes from './admin.routes';
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

// ─── Auth & KYC ──────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);

// ─── Dashboard & Admin ───────────────────────────────────────────────────────
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);

export default router;

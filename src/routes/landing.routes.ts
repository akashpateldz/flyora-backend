import { Router } from 'express';
import {
  getLandingData,
  getStats,
  getRoutes,
  getFeatures,
  getHowItWorks,
} from '../controllers/landing.controller';

const router = Router();

/**
 * @route   GET /api/landing
 * @desc    Get all landing page data at once
 * @access  Public
 */
router.get('/', getLandingData);

/**
 * @route   GET /api/stats
 * @desc    Get platform statistics
 * @access  Public
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/routes
 * @desc    Get popular shipping routes
 * @query   popular=true (optional)
 * @access  Public
 */
router.get('/routes', getRoutes);

/**
 * @route   GET /api/features
 * @desc    Get platform features
 * @query   category=trust|payment|convenience|support (optional)
 * @access  Public
 */
router.get('/features', getFeatures);

/**
 * @route   GET /api/how-it-works
 * @desc    Get how it works steps
 * @access  Public
 */
router.get('/how-it-works', getHowItWorks);

export default router;

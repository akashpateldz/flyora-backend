import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import apiRoutes from './routes/index';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';

const createApp = (): Application => {
  const app = express();

  // ─── Security Middleware ────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }));

  // ─── CORS Configuration ─────────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      const isAllowed = env.allowedOrigins.includes(origin) || 
                        origin.endsWith('.vercel.app') || 
                        /^https?:\/\/localhost:\d+$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours
  }));

  // ─── Rate Limiting ──────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', limiter);

  // ─── Body Parsing ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ─── Logging ────────────────────────────────────────────────────────────────
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
  }

  // ─── Root Route ─────────────────────────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: '✈️ Welcome to Flyora API - Premium Luggage Sharing Marketplace',
      version: env.apiVersion,
      documentation: '/api/health',
      endpoints: {
        health: 'GET /api/health',
        stats: 'GET /api/stats',
        routes: 'GET /api/routes',
        features: 'GET /api/features',
        waitlist: 'POST /api/waitlist',
        landing: 'GET /api/landing',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // ─── API Routes ──────────────────────────────────────────────────────────────
  app.use('/api', apiRoutes);

  // ─── Error Handling ─────────────────────────────────────────────────────────
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

export default createApp;

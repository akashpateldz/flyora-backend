import { Request, Response } from 'express';
import { env } from '../config/env';

export const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    hint: 'Available endpoints: GET /api/health, GET /api/stats, GET /api/routes, GET /api/features, POST /api/waitlist',
    timestamp: new Date().toISOString(),
    version: env.apiVersion,
  });
};

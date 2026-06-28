import { Request, Response } from 'express';
import { HealthStatus, ApiResponse } from '../types';
import { env } from '../config/env';
import { query } from '../services/db.service';

const startTime = Date.now();

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  let dbStatus: 'ok' | 'down' = 'ok';

  try {
    await query('SELECT 1');
  } catch (error) {
    dbStatus = 'down';
  }

  const healthStatus: HealthStatus = {
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    uptime,
    environment: env.nodeEnv,
    version: '1.0.0',
    services: {
      api: 'ok',
      database: dbStatus,
    },
  };

  const response: ApiResponse<HealthStatus> = {
    success: dbStatus === 'ok',
    message: dbStatus === 'ok' ? 'Flyora API is running smoothly ✈️' : 'Flyora API is degraded due to database connection issue.',
    data: healthStatus,
    timestamp: new Date().toISOString(),
    version: env.apiVersion,
  };

  res.status(dbStatus === 'ok' ? 200 : 500).json(response);
};

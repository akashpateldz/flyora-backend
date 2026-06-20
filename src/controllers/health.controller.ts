import { Request, Response } from 'express';
import { HealthStatus, ApiResponse } from '../types';
import { env } from '../config/env';

const startTime = Date.now();

export const getHealth = (_req: Request, res: Response): void => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const healthStatus: HealthStatus = {
    status: 'ok',
    uptime,
    environment: env.nodeEnv,
    version: '1.0.0',
    services: {
      api: 'ok',
      database: 'not_configured',
    },
  };

  const response: ApiResponse<HealthStatus> = {
    success: true,
    message: 'Flyora API is running smoothly ✈️',
    data: healthStatus,
    timestamp: new Date().toISOString(),
    version: env.apiVersion,
  };

  res.status(200).json(response);
};

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorMiddleware = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isDev = env.nodeEnv === 'development';

  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`, {
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'An unexpected error occurred',
    error: isDev ? err.message : undefined,
    stack: isDev ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    version: env.apiVersion,
  });
};

export const createError = (message: string, statusCode: number): CustomError => {
  const error: CustomError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

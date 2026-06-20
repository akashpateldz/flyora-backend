import { Request, Response } from 'express';
import { landingService } from '../services/landing.service';
import { ApiResponse, LandingData, Stat, Route, Feature } from '../types';
import { env } from '../config/env';

const buildResponse = <T>(data: T, message: string): ApiResponse<T> => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
  version: env.apiVersion,
});

export const getLandingData = (_req: Request, res: Response): void => {
  const data: LandingData = landingService.getLandingData();
  res.status(200).json(buildResponse(data, 'Landing page data retrieved successfully'));
};

export const getStats = (_req: Request, res: Response): void => {
  const stats: Stat[] = landingService.getStats();
  res.status(200).json(buildResponse(stats, `${stats.length} stats retrieved successfully`));
};

export const getRoutes = (req: Request, res: Response): void => {
  const popular = req.query.popular === 'true' ? true : undefined;
  const routes: Route[] = landingService.getRoutes(popular);
  res.status(200).json(buildResponse(routes, `${routes.length} routes retrieved successfully`));
};

export const getFeatures = (req: Request, res: Response): void => {
  const category = req.query.category as Feature['category'] | undefined;
  const validCategories: Feature['category'][] = ['trust', 'payment', 'convenience', 'support'];

  if (category && !validCategories.includes(category)) {
    res.status(400).json({
      success: false,
      message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      timestamp: new Date().toISOString(),
      version: env.apiVersion,
    });
    return;
  }

  const features: Feature[] = landingService.getFeatures(category);
  res.status(200).json(buildResponse(features, `${features.length} features retrieved successfully`));
};

export const getHowItWorks = (_req: Request, res: Response): void => {
  const steps = landingService.getHowItWorks();
  res.status(200).json(buildResponse(steps, `${steps.length} steps retrieved successfully`));
};

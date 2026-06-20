import { Request, Response } from 'express';
import { waitlistService } from '../services/waitlist.service';
import { WaitlistRequest, ApiResponse, WaitlistResponse } from '../types';
import { env } from '../config/env';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const joinWaitlist = async (req: Request, res: Response): Promise<void> => {
  const { email, name, role } = req.body as WaitlistRequest;

  // Validate email
  if (!email || typeof email !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Email address is required',
      timestamp: new Date().toISOString(),
      version: env.apiVersion,
    });
    return;
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
      timestamp: new Date().toISOString(),
      version: env.apiVersion,
    });
    return;
  }

  // Validate role if provided
  const validRoles = ['traveler', 'sender', 'both'];
  if (role && !validRoles.includes(role)) {
    res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      timestamp: new Date().toISOString(),
      version: env.apiVersion,
    });
    return;
  }

  const ipAddress = req.ip || req.socket.remoteAddress;

  const result: WaitlistResponse = await waitlistService.addToWaitlist(
    { email, name, role },
    ipAddress
  );

  const response: ApiResponse<WaitlistResponse> = {
    success: true,
    message: result.message,
    data: result,
    timestamp: new Date().toISOString(),
    version: env.apiVersion,
  };

  res.status(201).json(response);
};

export const getWaitlistCount = (_req: Request, res: Response): void => {
  const count = waitlistService.getCount();
  res.status(200).json({
    success: true,
    message: 'Waitlist count retrieved',
    data: { count },
    timestamp: new Date().toISOString(),
    version: env.apiVersion,
  });
};

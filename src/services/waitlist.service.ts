import { v4 as uuidv4 } from 'uuid';
import { WaitlistEntry, WaitlistRequest, WaitlistResponse } from '../types';
import { env } from '../config/env';

// ─── In-memory store (replace with DB in production) ─────────────────────────

const waitlist: WaitlistEntry[] = [];

// ─── Service ──────────────────────────────────────────────────────────────────

export class WaitlistService {
  async addToWaitlist(
    data: WaitlistRequest,
    ipAddress?: string
  ): Promise<WaitlistResponse> {
    // Check for duplicate email
    const existing = waitlist.find(
      (entry) => entry.email.toLowerCase() === data.email.toLowerCase()
    );

    if (existing) {
      const position = waitlist.indexOf(existing) + 1;
      return {
        id: existing.id,
        email: existing.email,
        position,
        message: `You're already on our waitlist at position #${position}. We'll be in touch soon!`,
      };
    }

    // Check capacity
    if (waitlist.length >= env.waitlistMaxEntries) {
      throw new Error('Waitlist is currently full. Please try again later.');
    }

    const entry: WaitlistEntry = {
      id: uuidv4(),
      email: data.email.toLowerCase().trim(),
      name: data.name?.trim(),
      role: data.role || 'both',
      createdAt: new Date().toISOString(),
      ipAddress,
    };

    waitlist.push(entry);
    const position = waitlist.length;

    return {
      id: entry.id,
      email: entry.email,
      position,
      message: `You've joined the Flyora waitlist at position #${position}! We'll notify you when we launch.`,
    };
  }

  getCount(): number {
    return waitlist.length;
  }

  isEmailRegistered(email: string): boolean {
    return waitlist.some(
      (entry) => entry.email.toLowerCase() === email.toLowerCase()
    );
  }
}

export const waitlistService = new WaitlistService();

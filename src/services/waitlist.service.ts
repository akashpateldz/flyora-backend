import { query } from './db.service';
import { WaitlistRequest, WaitlistResponse } from '../types';
import { env } from '../config/env';

export class WaitlistService {
  async addToWaitlist(
    data: WaitlistRequest,
    ipAddress?: string
  ): Promise<WaitlistResponse> {
    const email = data.email.toLowerCase().trim();

    // Check for duplicate email
    const existingRes = await query(
      'SELECT id, email FROM waitlist WHERE email = $1',
      [email]
    );

    if (existingRes.rowCount && existingRes.rowCount > 0) {
      const existing = existingRes.rows[0];
      const positionRes = await query(
        'SELECT COUNT(*) as position FROM waitlist WHERE created_at <= (SELECT created_at FROM waitlist WHERE email = $1)',
        [email]
      );
      const position = parseInt(positionRes.rows[0].position, 10);

      return {
        id: existing.id,
        email: existing.email,
        position,
        message: `You're already on our waitlist at position #${position}. We'll be in touch soon!`,
      };
    }

    // Check capacity
    const countRes = await query('SELECT COUNT(*) as count FROM waitlist');
    const currentCount = parseInt(countRes.rows[0].count, 10);
    if (currentCount >= env.waitlistMaxEntries) {
      throw new Error('Waitlist is currently full. Please try again later.');
    }

    // Insert new entry
    const insertRes = await query(
      `INSERT INTO waitlist (email, name, role, ip_address)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email`,
      [
        email,
        data.name?.trim() || null,
        data.role || 'both',
        ipAddress || null,
      ]
    );

    const newEntry = insertRes.rows[0];

    // Find position
    const positionRes = await query(
      'SELECT COUNT(*) as position FROM waitlist WHERE created_at <= (SELECT created_at FROM waitlist WHERE email = $1)',
      [email]
    );
    const position = parseInt(positionRes.rows[0].position, 10);

    return {
      id: newEntry.id,
      email: newEntry.email,
      position,
      message: `You've joined the Flyora waitlist at position #${position}! We'll notify you when we launch.`,
    };
  }

  async getCount(): Promise<number> {
    const countRes = await query('SELECT COUNT(*) as count FROM waitlist');
    return parseInt(countRes.rows[0].count, 10);
  }

  async isEmailRegistered(email: string): Promise<boolean> {
    const res = await query(
      'SELECT 1 FROM waitlist WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    return (res.rowCount !== null && res.rowCount > 0);
  }
}

export const waitlistService = new WaitlistService();

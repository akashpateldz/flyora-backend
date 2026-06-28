import { Pool, QueryResult } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  user: env.dbUser,
  password: env.dbPassword,
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbDatabase,
});

export const query = (text: string, params?: any[]): Promise<QueryResult> => {
  return pool.query(text, params);
};

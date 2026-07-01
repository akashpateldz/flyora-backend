import { Pool, PoolConfig, QueryResult } from 'pg';
import { env } from '../config/env';

const isProduction = env.nodeEnv === 'production';

const poolConfig: PoolConfig = env.databaseUrl
  ? {
      connectionString: env.databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      user: env.dbUser,
      password: env.dbPassword,
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbDatabase,
      ssl: false,
    };

export const pool = new Pool(poolConfig);

export const query = (text: string, params?: any[]): Promise<QueryResult> => {
  return pool.query(text, params);
};

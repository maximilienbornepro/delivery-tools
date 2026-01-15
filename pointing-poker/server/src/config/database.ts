import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);

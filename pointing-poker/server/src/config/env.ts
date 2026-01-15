import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (3 levels up: config -> src -> server -> pointing-poker -> root)
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });
// Also try local .env for backwards compatibility
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.POINTING_POKER_PORT || process.env.PORT || '3001', 10),
  clientPort: parseInt(process.env.POINTING_POKER_CLIENT_PORT || process.env.CLIENT_PORT || '5173', 10),
  dbPortExternal: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  dbPortInternal: 5432,
  databaseUrl: process.env.POINTING_POKER_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pointing_poker',
  corsOrigin: process.env.POINTING_POKER_CORS_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173',
  jira: {
    baseUrl: process.env.JIRA_BASE_URL || '',
    email: process.env.JIRA_EMAIL || '',
    apiToken: process.env.JIRA_API_TOKEN || '',
  },
};

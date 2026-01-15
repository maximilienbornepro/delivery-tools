import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jiraRoutes from './routes/jiraRoutes';
import positionsRoutes from './routes/positionsRoutes';
import mepRoutes from './routes/mepRoutes';
import confidenceRoutes from './routes/confidenceRoutes';
import piStateRoutes from './routes/piStateRoutes';
import { initDatabase } from './services/dbService';

// Load .env from project root (3 levels up: src -> server -> delivery -> root)
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });
// Also try local .env for backwards compatibility
dotenv.config();

const app = express();
const PORT = process.env.DELIVERY_PORT || process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    /\.ngrok\.app$/,
    /\.ngrok-free\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/jira', jiraRoutes);
app.use('/api/positions', positionsRoutes);
app.use('/api/mep', mepRoutes);
app.use('/api/confidence', confidenceRoutes);
app.use('/api/pi-state', piStateRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Print services summary
function printServicesSummary() {
  const clientPort = process.env.CLIENT_PORT || '5175';
  const dbUrl = process.env.DATABASE_URL || '';
  const dbPort = dbUrl.match(/:(\d+)\//)?.[1] || '5433';

  console.log('\n========================================');
  console.log('         DELIVERY - Services');
  console.log('========================================');
  console.log(`  Client (Frontend): http://localhost:${clientPort}`);
  console.log(`  Server (API)     : http://localhost:${PORT}`);
  console.log(`  PostgreSQL       : localhost:${dbPort}`);
  console.log('----------------------------------------');
  console.log(`  JIRA Project     : ${process.env.JIRA_PROJECT_KEY || 'SMARTV'}`);
  console.log('========================================\n');
}

// Start server
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      printServicesSummary();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

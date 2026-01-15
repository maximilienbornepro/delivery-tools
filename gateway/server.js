import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from root
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.GATEWAY_PORT || 3005;

// Ngrok domains configuration
const NGROK_DOMAINS = {
  gateway: 'francet-tv.ngrok.app',
  pointingPoker: 'poker-tv.ngrok.app',
  delivery: 'delivery-tv.ngrok.app',
  planification: 'planification.ngrok.app'
};

// Check if request is coming from ngrok
function isNgrokRequest(req) {
  const host = req.get('host') || '';
  return host.includes('ngrok');
}

// Get app URLs based on request origin
function getAppUrls(req) {
  if (isNgrokRequest(req)) {
    return {
      pointingPoker: `https://${NGROK_DOMAINS.pointingPoker}`,
      delivery: `https://${NGROK_DOMAINS.delivery}`,
      planification: `https://${NGROK_DOMAINS.planification}`
    };
  }
  return {
    pointingPoker: `http://localhost:${process.env.POINTING_POKER_CLIENT_PORT || 5173}`,
    delivery: `http://localhost:${process.env.DELIVERY_CLIENT_PORT || 5175}`,
    planification: `http://localhost:${process.env.PLANIFICATION_PORT || 3200}`
  };
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get application URLs
app.get('/api/apps', (req, res) => {
  const urls = getAppUrls(req);
  res.json({
    apps: [
      {
        id: 'pointing-poker',
        name: 'Pointing Poker',
        description: 'Estimation collaborative des tickets JIRA en equipe',
        url: urls.pointingPoker,
        icon: 'cards',
        color: '#667eea'
      },
      {
        id: 'delivery',
        name: 'Delivery Board',
        description: 'Suivi et visualisation des livraisons par sprint',
        url: urls.delivery,
        icon: 'board',
        color: '#059669'
      },
      {
        id: 'planification',
        name: 'Planification',
        description: 'Outil de planification des sprints',
        url: urls.planification,
        icon: 'calendar',
        color: '#f59e0b'
      }
    ]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve landing page for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Gateway server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Applications disponibles:');
  console.log(`  - Pointing Poker: http://localhost:${process.env.POINTING_POKER_CLIENT_PORT || 5173}`);
  console.log(`  - Delivery Board: http://localhost:${process.env.DELIVERY_CLIENT_PORT || 5175}`);
  console.log(`  - Planification:  http://localhost:${process.env.PLANIFICATION_PORT || 3200}`);
});

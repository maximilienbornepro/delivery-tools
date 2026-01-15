import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Ports configuration
const PORTS = {
  server: 3001,
  client: 5173,
  dbExternal: 5435,
  dbInternal: 5432,
};

function printServiceSummary(): Plugin {
  return {
    name: 'print-service-summary',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        setTimeout(() => {
          const serverPort = String(PORTS.server).padEnd(4);
          const clientPort = String(PORTS.client).padEnd(4);
          const dbPorts = `${PORTS.dbExternal} (ext) : ${PORTS.dbInternal} (int)`.padEnd(25);

          console.log('\n╔═══════════════════════════════════════════════════╗');
          console.log('║         Pointing Poker - France TV                ║');
          console.log('╠═══════════════════════════════════════════════════╣');
          console.log('║  Service          │  Port                         ║');
          console.log('╠───────────────────┼───────────────────────────────╣');
          console.log(`║  Serveur API      │  ${serverPort}                         ║`);
          console.log(`║  Client (Vite)    │  ${clientPort}                         ║`);
          console.log(`║  PostgreSQL       │  ${dbPorts}║`);
          console.log('╚═══════════════════════════════════════════════════╝\n');
        }, 100);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), printServiceSummary()],
  server: {
    port: PORTS.client,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `http://localhost:${PORTS.server}`,
        changeOrigin: true,
      },
      '/socket.io': {
        target: `http://localhost:${PORTS.server}`,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});

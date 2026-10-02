import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { studiesRoute } from './routes/studies.js';

const app = new Hono();

// Middlewares
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Health Check
app.get('/health', (c) => {
  return c.json({
    service: 'market-research-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount Routes
app.route('/api/studies', studiesRoute);

const port = parseInt(process.env.PORT || '3004', 10);

console.log(`🚀 Advantia Market Research Service ejecutándose en http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});

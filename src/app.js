import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createApiRouter, createAdminRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp(generator) {
  const app = express();
  const state = { shuttingDown: false };

  app.use(cookieParser());
  app.use(express.static(join(__dirname, 'public')));
  app.use(express.json());

  app.get('/healthz', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send('ok');
  });

  app.get('/readyz', (req, res) => {
    if (state.shuttingDown) {
      res.status(503).set('Content-Type', 'text/plain').send('shutting down');
      return;
    }
    res.set('Content-Type', 'text/plain');
    res.send('ok');
  });

  app.use('/api', createApiRouter(generator));
  app.use('/api/admin', createAdminRouter());
  app.get('/admin', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'admin.html'));
  });

  const shutdown = {
    begin() {
      state.shuttingDown = true;
    },
  };

  return { app, shutdown };
}

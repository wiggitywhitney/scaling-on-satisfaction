import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { resetState } from '../src/routes/api.js';

function startServer(app) {
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

function fetch(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path, method: 'GET' },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, body });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

describe('health endpoints', () => {
  let mockGenerator;

  beforeEach(() => {
    resetState();
    mockGenerator = {
      generatePart: () => Promise.resolve({ text: 'test', responseId: 'msg_1' }),
    };
  });

  describe('GET /healthz', () => {
    it('returns 200 OK', async () => {
      const { app } = createApp(mockGenerator);
      const { server, port } = await startServer(app);
      try {
        const res = await fetch(port, '/healthz');
        expect(res.status).toBe(200);
        expect(res.body).toBe('ok');
      } finally {
        server.close();
      }
    });
  });

  describe('GET /readyz', () => {
    it('returns 200 OK when server is ready', async () => {
      const { app } = createApp(mockGenerator);
      const { server, port } = await startServer(app);
      try {
        const res = await fetch(port, '/readyz');
        expect(res.status).toBe(200);
        expect(res.body).toBe('ok');
      } finally {
        server.close();
      }
    });

    it('returns 503 when server is shutting down', async () => {
      const { app, shutdown } = createApp(mockGenerator);
      const { server, port } = await startServer(app);
      try {
        shutdown.begin();
        const res = await fetch(port, '/readyz');
        expect(res.status).toBe(503);
        expect(res.body).toBe('shutting down');
      } finally {
        server.close();
      }
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createApiRouter, createAdminRouter, resetState } from '../../src/routes/api.js';

function buildApp(mockGenerator) {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', createApiRouter(mockGenerator));
  app.use('/api/admin', createAdminRouter());
  return app;
}

async function request(app, path, { cookies = {}, method = 'GET' } = {}) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

  const { default: http } = await import('node:http');
  const server = http.createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {},
      };
      if (cookieHeader) options.headers.Cookie = cookieHeader;

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          server.close();
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: body ? JSON.parse(body) : null,
            });
          } catch {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body,
            });
          }
        });
      });
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      req.end();
    });
  });
}

describe('API routes', () => {
  let mockGenerator;

  beforeEach(() => {
    resetState();
    mockGenerator = {
      generatePart: vi.fn().mockResolvedValue({
        text: 'The platform engineer gazed at the lunar horizon...',
        responseId: 'msg_test_001',
      }),
    };
  });

  describe('GET /api/story/:part', () => {
    it('returns 403 when part is not yet available', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/1');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/not available yet/i);
    });

    it('returns generated story part after presenter advances', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/story/1');

      expect(res.status).toBe(200);
      expect(res.body.part).toBe(1);
      expect(res.body.totalParts).toBe(5);
      expect(res.body.text).toBe('The platform engineer gazed at the lunar horizon...');
    });

    it('sets a session cookie on first request', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/story/1');

      expect(res.headers['set-cookie']).toBeDefined();
      const cookie = res.headers['set-cookie'][0];
      expect(cookie).toMatch(/sessionId=/);
    });

    it('caches story part for same session', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });

      const res1 = await request(app, '/api/story/1');
      const cookie = res1.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      const res2 = await request(app, '/api/story/1', { cookies: { sessionId } });

      expect(mockGenerator.generatePart).toHaveBeenCalledOnce();
      expect(res2.body.text).toBe(res1.body.text);
    });

    it('returns 404 for part 6 (out of range)', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/6');

      expect(res.status).toBe(404);
    });

    it('returns 404 for part 0 (out of range)', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/0');

      expect(res.status).toBe(404);
    });

    it('returns 400 for non-numeric part', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/abc');

      expect(res.status).toBe(400);
    });

    it('returns 500 when generator fails', async () => {
      mockGenerator.generatePart.mockRejectedValue(new Error('API error'));
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/story/1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/story/status', () => {
    it('returns currentPart 0 before any advancement', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/status');

      expect(res.status).toBe(200);
      expect(res.body.totalParts).toBe(5);
      expect(res.body.currentPart).toBe(0);
      expect(res.body.generatedParts).toEqual([]);
    });

    it('reflects currentPart after presenter advances', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/story/status');

      expect(res.body.currentPart).toBe(1);
    });

    it('shows generated parts after fetching a story part', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });

      const res1 = await request(app, '/api/story/1');
      const cookie = res1.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      const res2 = await request(app, '/api/story/status', { cookies: { sessionId } });

      expect(res2.body.generatedParts).toEqual([1]);
    });
  });

  describe('POST /admin/advance', () => {
    it('advances currentPart from 0 to 1', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance', { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.currentPart).toBe(1);
      expect(res.body.totalParts).toBe(5);
    });

    it('advances sequentially through all 5 parts', async () => {
      const app = buildApp(mockGenerator);
      for (let i = 1; i <= 5; i++) {
        const res = await request(app, '/api/admin/advance', { method: 'POST' });
        expect(res.body.currentPart).toBe(i);
      }
    });

    it('returns 400 when already at part 5', async () => {
      const app = buildApp(mockGenerator);
      for (let i = 0; i < 5; i++) {
        await request(app, '/api/admin/advance', { method: 'POST' });
      }
      const res = await request(app, '/api/admin/advance', { method: 'POST' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/last part/i);
    });
  });

  describe('POST /admin/reset', () => {
    it('resets currentPart to 0', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      await request(app, '/api/admin/advance', { method: 'POST' });

      const res = await request(app, '/api/admin/reset', { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.currentPart).toBe(0);
    });
  });
});

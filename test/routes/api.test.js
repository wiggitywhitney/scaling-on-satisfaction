import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';

vi.mock('../../src/telemetry.js', () => ({
  emitEvaluationEvent: vi.fn(),
}));

import { createApiRouter, createAdminRouter, resetState } from '../../src/routes/api.js';
import { emitEvaluationEvent } from '../../src/telemetry.js';
import config from '../../src/config.js';

function buildApp(mockGenerator) {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', createApiRouter(mockGenerator));
  app.use('/api/admin', createAdminRouter());
  return app;
}

async function request(app, path, { cookies = {}, method = 'GET', body = null } = {}) {
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
      if (body !== null) {
        options.headers['Content-Type'] = 'application/json';
      }

      const req = http.request(options, (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          server.close();
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: resBody ? JSON.parse(resBody) : null,
            });
          } catch {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: resBody,
            });
          }
        });
      });
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      if (body !== null) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

describe('API routes', () => {
  let mockGenerator;

  beforeEach(() => {
    resetState();
    vi.clearAllMocks();
    mockGenerator = {
      generatePart: vi.fn().mockResolvedValue({
        text: 'The platform engineer gazed at the lunar horizon...',
        responseId: 'msg_test_001',
        spanContext: { traceId: 'trace_001', spanId: 'span_001', traceFlags: 1 },
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

  describe('POST /api/story/:part/vote', () => {
    async function setupSessionWithPart(app, mockGen) {
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/story/1');
      const cookie = res.headers['set-cookie'][0].split(';')[0];
      return cookie.split('=')[1];
    }

    it('accepts thumbs_up vote and returns vote with responseId', async () => {
      const app = buildApp(mockGenerator);
      const sessionId = await setupSessionWithPart(app, mockGenerator);

      const res = await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_up' },
      });

      expect(res.status).toBe(200);
      expect(res.body.part).toBe(1);
      expect(res.body.vote).toBe('thumbs_up');
      expect(res.body.responseId).toBe('msg_test_001');
    });

    it('accepts thumbs_down vote', async () => {
      const app = buildApp(mockGenerator);
      const sessionId = await setupSessionWithPart(app, mockGenerator);

      const res = await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_down' },
      });

      expect(res.status).toBe(200);
      expect(res.body.vote).toBe('thumbs_down');
    });

    it('allows changing vote from thumbs_up to thumbs_down', async () => {
      const app = buildApp(mockGenerator);
      const sessionId = await setupSessionWithPart(app, mockGenerator);

      await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_up' },
      });

      const res = await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_down' },
      });

      expect(res.status).toBe(200);
      expect(res.body.vote).toBe('thumbs_down');
    });

    it('returns 400 for invalid vote value', async () => {
      const app = buildApp(mockGenerator);
      const sessionId = await setupSessionWithPart(app, mockGenerator);

      const res = await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'invalid' },
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/thumbs_up.*thumbs_down/);
    });

    it('returns 400 when vote field is missing', async () => {
      const app = buildApp(mockGenerator);
      const sessionId = await setupSessionWithPart(app, mockGenerator);

      const res = await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: {},
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for part not yet generated by this session', async () => {
      const app = buildApp(mockGenerator);
      // Advance to part 2 but only generate part 1
      await request(app, '/api/admin/advance', { method: 'POST' });
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res1 = await request(app, '/api/story/1');
      const cookie = res1.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      const res = await request(app, '/api/story/2/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_up' },
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not generated/i);
    });

    it('returns 403 for part not yet advanced by presenter', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/1/vote', {
        method: 'POST',
        body: { vote: 'thumbs_up' },
      });

      expect(res.status).toBe(403);
    });

    it('returns 404 for out-of-range part', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/6/vote', {
        method: 'POST',
        body: { vote: 'thumbs_up' },
      });

      expect(res.status).toBe(404);
    });

    it('emits OTel evaluation event on thumbs_up vote', async () => {
      const app = buildApp(mockGenerator);
      const sessionId = await setupSessionWithPart(app, mockGenerator);

      await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_up' },
      });

      expect(emitEvaluationEvent).toHaveBeenCalledOnce();
      expect(emitEvaluationEvent).toHaveBeenCalledWith({
        vote: 'thumbs_up',
        responseId: 'msg_test_001',
        generationSpanContext: { traceId: 'trace_001', spanId: 'span_001', traceFlags: 1 },
      });
    });

    it('emits OTel evaluation event on thumbs_down vote', async () => {
      const app = buildApp(mockGenerator);
      const sessionId = await setupSessionWithPart(app, mockGenerator);

      await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_down' },
      });

      expect(emitEvaluationEvent).toHaveBeenCalledWith({
        vote: 'thumbs_down',
        responseId: 'msg_test_001',
        generationSpanContext: { traceId: 'trace_001', spanId: 'span_001', traceFlags: 1 },
      });
    });

    it('emits OTel event on vote change', async () => {
      const app = buildApp(mockGenerator);
      const sessionId = await setupSessionWithPart(app, mockGenerator);

      await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_up' },
      });
      await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_down' },
      });

      expect(emitEvaluationEvent).toHaveBeenCalledTimes(2);
      expect(emitEvaluationEvent.mock.calls[1][0].vote).toBe('thumbs_down');
    });

    it('does not emit OTel event on invalid vote', async () => {
      const app = buildApp(mockGenerator);
      const sessionId = await setupSessionWithPart(app, mockGenerator);

      await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'invalid' },
      });

      expect(emitEvaluationEvent).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/story/:part vote field', () => {
    it('returns vote: null when no vote cast', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/story/1');

      expect(res.body.vote).toBeNull();
    });

    it('returns vote value after voting', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });

      const res1 = await request(app, '/api/story/1');
      const cookie = res1.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      await request(app, '/api/story/1/vote', {
        method: 'POST',
        cookies: { sessionId },
        body: { vote: 'thumbs_up' },
      });

      const res2 = await request(app, '/api/story/1', { cookies: { sessionId } });

      expect(res2.body.vote).toBe('thumbs_up');
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

  describe('multi-variant admin forwarding', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      config.variantUrls = [];
    });

    afterEach(() => {
      config.variantUrls = [];
      global.fetch = originalFetch;
    });

    it('advance returns empty variants array when no variant URLs configured', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance', { method: 'POST' });

      expect(res.body.variants).toEqual([]);
    });

    it('reset returns empty variants array when no variant URLs configured', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/reset', { method: 'POST' });

      expect(res.body.variants).toEqual([]);
    });

    it('advance forwards to variant URLs', async () => {
      config.variantUrls = ['http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5 }),
      });

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance', { method: 'POST' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://app-1b:8080/api/admin/advance',
        { method: 'POST' }
      );
      expect(res.body.variants).toHaveLength(1);
      expect(res.body.variants[0].ok).toBe(true);
      expect(res.body.variants[0].url).toBe('http://app-1b:8080');
    });

    it('reset forwards to variant URLs', async () => {
      config.variantUrls = ['http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ currentPart: 0, totalParts: 5 }),
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/admin/reset', { method: 'POST' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://app-1b:8080/api/admin/reset',
        { method: 'POST' }
      );
      expect(res.body.variants).toHaveLength(1);
      expect(res.body.variants[0].ok).toBe(true);
    });

    it('forwards to multiple variant URLs', async () => {
      config.variantUrls = ['http://app-1a:8080', 'http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5 }),
      });

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance', { method: 'POST' });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(res.body.variants).toHaveLength(2);
    });

    it('handles variant URL failure gracefully', async () => {
      config.variantUrls = ['http://unreachable:8080'];
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance', { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.currentPart).toBe(1);
      expect(res.body.variants).toHaveLength(1);
      expect(res.body.variants[0].ok).toBe(false);
      expect(res.body.variants[0].error).toMatch(/Connection refused/);
    });

    it('strips trailing slash from variant URLs', async () => {
      config.variantUrls = ['http://app-1b:8080/'];
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5 }),
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://app-1b:8080/api/admin/advance',
        { method: 'POST' }
      );
    });
  });
});

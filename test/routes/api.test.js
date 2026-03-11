// ABOUTME: Tests for API routes — story delivery, voting, and admin controls
// ABOUTME: Verifies story generation flow, OTel vote events, and multi-variant admin
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';

vi.mock('../../src/telemetry.js', () => ({
  emitEvaluationEvent: vi.fn(),
}));

import { createApiRouter, createAdminRouter, resetState, getSharedStory } from '../../src/routes/api.js';
import { emitEvaluationEvent } from '../../src/telemetry.js';
import config from '../../src/config.js';

function buildApp(mockGenerator) {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', createApiRouter(mockGenerator));
  app.use('/api/admin', createAdminRouter(mockGenerator));
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
    // Disable pre-gen delay for most tests to avoid timing issues
    config.pregenDelayMs = 0;
    config.pregenRetryDelayMs = 5000;
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

      // Part 1 generated once (cached on second fetch); pre-generation may add a call for part 2
      expect(mockGenerator.generatePart).toHaveBeenCalledWith(1, config.variantStyle, config.variantModel, config.round);
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

  describe('GET /api/story/:part with shared story', () => {
    it('serves shared pre-generated story instead of generating per-session', async () => {
      mockGenerator.generatePart = vi.fn().mockImplementation((part) =>
        Promise.resolve({
          text: `Shared part ${part}`, responseId: `msg_shared_${part}`,
          spanContext: { traceId: `t_${part}`, spanId: `s_${part}`, traceFlags: 1 },
        })
      );

      const app = buildApp(mockGenerator);
      // Pre-generate shared stories
      await request(app, '/api/admin/pre-generate', { method: 'POST' });
      const preGenCalls = mockGenerator.generatePart.mock.calls.length;

      // Advance and fetch story
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/story/1');

      expect(res.status).toBe(200);
      expect(res.body.text).toBe('Shared part 1');
      // No additional generation calls — served from shared store
      expect(mockGenerator.generatePart.mock.calls.length).toBe(preGenCalls);
    });

    it('returns responseId and spanContext from shared story for vote linking', async () => {
      mockGenerator.generatePart = vi.fn().mockResolvedValue({
        text: 'Shared text', responseId: 'msg_shared_1',
        spanContext: { traceId: 'trace_shared', spanId: 'span_shared', traceFlags: 1 },
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/pre-generate', { method: 'POST' });
      await request(app, '/api/admin/advance', { method: 'POST' });

      // Fetch story to populate session
      const storyRes = await request(app, '/api/story/1');
      const cookie = storyRes.headers['set-cookie'][0].split(';')[0].split('=')[1];

      // Vote on it
      const voteRes = await request(app, '/api/story/1/vote', {
        method: 'POST', cookies: { sessionId: cookie },
        body: { vote: 'thumbs_up' },
      });

      expect(voteRes.status).toBe(200);
      expect(voteRes.body.responseId).toBe('msg_shared_1');
    });

    it('falls back to on-demand generation when shared story not available', async () => {
      // Don't pre-generate — shared store is empty
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/story/1');

      expect(res.status).toBe(200);
      expect(res.body.text).toBe('The platform engineer gazed at the lunar horizon...');
      // Called at least once for part 1 (may also pre-gen part 2 in background)
      expect(mockGenerator.generatePart).toHaveBeenCalledWith(
        1, config.variantStyle, config.variantModel, config.round
      );
    });

    it('on-demand generation stores result in shared store for other users', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });

      // First user triggers on-demand generation
      await request(app, '/api/story/1');
      const genCallsBefore = mockGenerator.generatePart.mock.calls.filter(c => c[0] === 1).length;

      // Second user should get the shared story without generating
      const res2 = await request(app, '/api/story/1');
      const genCallsAfter = mockGenerator.generatePart.mock.calls.filter(c => c[0] === 1).length;

      expect(res2.status).toBe(200);
      expect(res2.body.text).toBe('The platform engineer gazed at the lunar horizon...');
      expect(genCallsAfter).toBe(genCallsBefore); // No new generation call for part 1
    });

    it('concurrent on-demand requests only generate once (in-flight dedup)', async () => {
      let resolveGeneration;
      let callCount = 0;
      mockGenerator.generatePart = vi.fn().mockImplementation((part) => {
        callCount++;
        if (part === 1 && callCount === 1) {
          return new Promise((resolve) => {
            resolveGeneration = () => resolve({
              text: 'Generated once', responseId: 'msg_once',
              spanContext: { traceId: 't', spanId: 's', traceFlags: 1 },
            });
          });
        }
        return Promise.resolve({
          text: `Part ${part}`, responseId: `msg_${part}`,
          spanContext: { traceId: `t_${part}`, spanId: `s_${part}`, traceFlags: 1 },
        });
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });

      // Two concurrent requests for part 1
      const p1 = request(app, '/api/story/1');
      const p2 = request(app, '/api/story/1');

      // Resolve the in-flight generation
      await new Promise(r => setTimeout(r, 50)); // Let both requests enter handler
      resolveGeneration();

      const [res1, res2] = await Promise.all([p1, p2]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.text).toBe('Generated once');
      expect(res2.body.text).toBe('Generated once');
      // Part 1 should only be generated once
      const part1Calls = mockGenerator.generatePart.mock.calls.filter(c => c[0] === 1);
      expect(part1Calls.length).toBe(1);
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

    it('does not create a session on poll', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/story/status');
      await request(app, '/api/story/status');
      await request(app, '/api/story/status');

      const adminRes = await request(app, '/api/admin/status');
      expect(adminRes.body.sessions).toBe(0);
    });

    it('shows generated parts after fetching a story part', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });

      const res1 = await request(app, '/api/story/1');
      const cookie = res1.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      // Allow pre-generation to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      const res2 = await request(app, '/api/story/status', { cookies: { sessionId } });

      // Part 1 is always present; part 2 may be pre-generated
      expect(res2.body.generatedParts).toContain(1);
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

    it('rejects vote change after initial vote is locked', async () => {
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

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already voted/i);
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
      // Advance to parts 1-3, generate part 1 only
      // Use part 3 for the vote test to avoid pre-generation of part 2
      await request(app, '/api/admin/advance', { method: 'POST' });
      await request(app, '/api/admin/advance', { method: 'POST' });
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res1 = await request(app, '/api/story/1');
      const cookie = res1.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      // Part 3 was never generated (pre-gen only does N+1, so part 1 pre-gens part 2)
      const res = await request(app, '/api/story/3/vote', {
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

    it('does not emit OTel event on rejected vote change', async () => {
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

      expect(emitEvaluationEvent).toHaveBeenCalledTimes(1);
      expect(emitEvaluationEvent.mock.calls[0][0].vote).toBe('thumbs_up');
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

  describe('POST /api/story/warmup', () => {
    it('creates a session and starts pre-generating part 1', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/warmup', { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();

      // Wait for background generation
      await new Promise(resolve => setTimeout(resolve, 50));

      // Part 1 should be pre-generated in the session
      const cookie = res.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      // Advance and fetch — should use cached part
      await request(app, '/api/admin/advance', { method: 'POST' });
      const storyRes = await request(app, '/api/story/1', { cookies: { sessionId } });

      expect(storyRes.status).toBe(200);
      expect(storyRes.body.text).toBe('The platform engineer gazed at the lunar horizon...');
      // Only 1 generation call total (from warmup), not 2
      expect(mockGenerator.generatePart).toHaveBeenCalledTimes(1);
    });

    it('does not regenerate if session already has part 1', async () => {
      const app = buildApp(mockGenerator);
      const res1 = await request(app, '/api/story/warmup', { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const cookie = res1.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      // Second warmup with same session
      await request(app, '/api/story/warmup', { method: 'POST', cookies: { sessionId } });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockGenerator.generatePart).toHaveBeenCalledTimes(1);
    });

    it('returns session cookie even before admin advances', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/warmup', { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.warming).toBe(true);
    });
  });

  describe('eager pre-generation', () => {
    it('pre-generates next part after serving current part', async () => {
      let generateCallCount = 0;
      const slowGenerator = {
        generatePart: vi.fn().mockImplementation(() => {
          generateCallCount++;
          return Promise.resolve({
            text: `Story part ${generateCallCount}`,
            responseId: `msg_${generateCallCount}`,
            spanContext: { traceId: 'trace_001', spanId: 'span_001', traceFlags: 1 },
          });
        }),
      };

      const app = buildApp(slowGenerator);
      // Advance to part 1 and 2
      await request(app, '/api/admin/advance', { method: 'POST' });
      await request(app, '/api/admin/advance', { method: 'POST' });

      // Fetch part 1 — triggers pre-generation of part 2
      const res1 = await request(app, '/api/story/1');
      const cookie = res1.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      // Wait for pre-generation to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Fetch part 2 — should use pre-generated cache
      const res2 = await request(app, '/api/story/2', { cookies: { sessionId } });

      expect(res2.status).toBe(200);
      expect(res2.body.text).toBe('Story part 2');
      // Generator called twice: once for part 1, once for pre-gen of part 2
      expect(slowGenerator.generatePart).toHaveBeenCalledTimes(2);
    });

    it('does not pre-generate beyond total parts', async () => {
      const app = buildApp(mockGenerator);
      // Advance to part 5
      for (let i = 0; i < 5; i++) {
        await request(app, '/api/admin/advance', { method: 'POST' });
      }

      // Fetch part 5 — should not attempt pre-generation of part 6
      await request(app, '/api/story/5');

      // Wait for any pre-generation attempt
      await new Promise(resolve => setTimeout(resolve, 50));

      // Only one call: for part 5 itself
      expect(mockGenerator.generatePart).toHaveBeenCalledTimes(1);
      expect(mockGenerator.generatePart).toHaveBeenCalledWith(5, config.variantStyle, config.variantModel, config.round);
    });

    it('does not pre-generate if next part is already cached', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      await request(app, '/api/admin/advance', { method: 'POST' });

      // Fetch part 1
      const res1 = await request(app, '/api/story/1');
      const cookie = res1.headers['set-cookie'][0].split(';')[0];
      const sessionId = cookie.split('=')[1];

      // Wait for pre-generation of part 2
      await new Promise(resolve => setTimeout(resolve, 50));

      // Fetch part 1 again — should not re-trigger pre-generation
      await request(app, '/api/story/1', { cookies: { sessionId } });
      await new Promise(resolve => setTimeout(resolve, 50));

      // Two calls total: part 1 generation + part 2 pre-generation
      expect(mockGenerator.generatePart).toHaveBeenCalledTimes(2);
    });

    it('logs pre-generation failure and retries after delay', async () => {
      const previousRetryDelay = config.pregenRetryDelayMs;
      const previousPregenDelay = config.pregenDelayMs;
      config.pregenRetryDelayMs = 50; // Short delay for testing
      config.pregenDelayMs = 0; // No stagger for this test

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        let callCount = 0;
        const failingGenerator = {
          generatePart: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 2) return Promise.reject(new Error('Pre-gen failed'));
            return Promise.resolve({
              text: 'Story text',
              responseId: 'msg_001',
              spanContext: { traceId: 'trace_001', spanId: 'span_001', traceFlags: 1 },
            });
          }),
        };

        const app = buildApp(failingGenerator);
        await request(app, '/api/admin/advance', { method: 'POST' });
        await request(app, '/api/admin/advance', { method: 'POST' });

        // Fetch part 1 — pre-generation of part 2 will fail, log, and retry
        const res1 = await request(app, '/api/story/1');
        expect(res1.status).toBe(200);

        // Wait for failed pre-gen + retry delay + retry completion
        await new Promise(resolve => setTimeout(resolve, 150));

        // Error should have been logged
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Pre-generation failed for part 2')
        );

        const cookie = res1.headers['set-cookie'][0].split(';')[0];
        const sessionId = cookie.split('=')[1];

        // Fetch part 2 — should use the retry result
        const res2 = await request(app, '/api/story/2', { cookies: { sessionId } });
        expect(res2.status).toBe(200);
        // 3 calls: part 1 gen, part 2 pre-gen (fails), part 2 retry (succeeds)
        // Part 2 fetch uses cache, no new gen. Part 2 serving also triggers part 3 pre-gen
        // but part 2 is served from cache so no pre-gen of part 3
        expect(failingGenerator.generatePart).toHaveBeenCalledTimes(3);
      } finally {
        config.pregenRetryDelayMs = previousRetryDelay;
        config.pregenDelayMs = previousPregenDelay;
        consoleSpy.mockRestore();
      }
    });

    it('delays pre-generation by pregenDelayMs', async () => {
      const previousPregenDelay = config.pregenDelayMs;
      config.pregenDelayMs = 100;

      try {
        const callTimes = [];
        const staggerGenerator = {
          generatePart: vi.fn().mockImplementation(() => {
            callTimes.push(Date.now());
            return Promise.resolve({
              text: 'Story text',
              responseId: 'msg_001',
              spanContext: { traceId: 'trace_001', spanId: 'span_001', traceFlags: 1 },
            });
          }),
        };

        const app = buildApp(staggerGenerator);
        await request(app, '/api/admin/advance', { method: 'POST' });
        await request(app, '/api/admin/advance', { method: 'POST' });

        // Fetch part 1 — pre-generation of part 2 should be delayed
        await request(app, '/api/story/1');

        // Wait for delayed pre-generation
        await new Promise(resolve => setTimeout(resolve, 200));

        expect(staggerGenerator.generatePart).toHaveBeenCalledTimes(2);
        // Pre-gen call should have been delayed by ~100ms
        const gap = callTimes[1] - callTimes[0];
        expect(gap).toBeGreaterThanOrEqual(80); // timing tolerance
      } finally {
        config.pregenDelayMs = previousPregenDelay;
      }
    });

    it('delays warmup pre-generation by pregenDelayMs', async () => {
      const previousPregenDelay = config.pregenDelayMs;
      config.pregenDelayMs = 100;

      try {
        const callTime = { start: 0, gen: 0 };
        const timedGenerator = {
          generatePart: vi.fn().mockImplementation(() => {
            callTime.gen = Date.now();
            return Promise.resolve({
              text: 'Story text',
              responseId: 'msg_001',
              spanContext: { traceId: 'trace_001', spanId: 'span_001', traceFlags: 1 },
            });
          }),
        };

        const app = buildApp(timedGenerator);
        callTime.start = Date.now();
        await request(app, '/api/story/warmup', { method: 'POST' });

        // Wait for delayed warmup generation
        await new Promise(resolve => setTimeout(resolve, 200));

        expect(timedGenerator.generatePart).toHaveBeenCalledTimes(1);
        const gap = callTime.gen - callTime.start;
        expect(gap).toBeGreaterThanOrEqual(80); // timing tolerance
      } finally {
        config.pregenDelayMs = previousPregenDelay;
      }
    });
  });

  describe('GET /api/story/:part generation delay', () => {
    it('delays response when MIN_GENERATION_DELAY_MS is set and generation is fast', async () => {
      const previousDelay = config.minGenerationDelayMs;
      config.minGenerationDelayMs = 200;
      try {
        const app = buildApp(mockGenerator);
        await request(app, '/api/admin/advance', { method: 'POST' });

        const start = Date.now();
        await request(app, '/api/story/1');
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThanOrEqual(180); // allow small timing tolerance
      } finally {
        config.minGenerationDelayMs = previousDelay;
      }
    });

    it('does not delay cached responses', async () => {
      const previousDelay = config.minGenerationDelayMs;
      config.minGenerationDelayMs = 200;
      try {
        const app = buildApp(mockGenerator);
        await request(app, '/api/admin/advance', { method: 'POST' });

        const res1 = await request(app, '/api/story/1');
        const cookie = res1.headers['set-cookie'][0].split(';')[0];
        const sessionId = cookie.split('=')[1];

        const start = Date.now();
        await request(app, '/api/story/1', { cookies: { sessionId } });
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(100);
      } finally {
        config.minGenerationDelayMs = previousDelay;
      }
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
        ok: true,
        status: 200,
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
        ok: true,
        status: 200,
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

    it('forwards admin secret to variant URLs', async () => {
      config.variantUrls = ['http://app-1b:8080'];
      config.adminSecret = 'test-secret';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5 }),
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance?secret=test-secret', { method: 'POST' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://app-1b:8080/api/admin/advance?secret=test-secret',
        { method: 'POST' }
      );
      config.adminSecret = '';
    });

    it('reports variant response status accurately', async () => {
      config.variantUrls = ['http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance', { method: 'POST' });

      expect(res.body.variants[0].ok).toBe(false);
      expect(res.body.variants[0].status).toBe(401);
    });

    it('forwards to multiple variant URLs', async () => {
      config.variantUrls = ['http://app-1a:8080', 'http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
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
        ok: true,
        status: 200,
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

  describe('admin auth', () => {
    const originalSecret = config.adminSecret;

    afterEach(() => {
      config.adminSecret = originalSecret;
    });

    it('allows advance without secret when ADMIN_SECRET is not set', async () => {
      config.adminSecret = '';
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance', { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.currentPart).toBe(1);
    });

    it('allows reset without secret when ADMIN_SECRET is not set', async () => {
      config.adminSecret = '';
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/reset', { method: 'POST' });

      expect(res.status).toBe(200);
    });

    it('rejects advance without secret when ADMIN_SECRET is set', async () => {
      config.adminSecret = 'test-secret';
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance', { method: 'POST' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/);
    });

    it('rejects reset without secret when ADMIN_SECRET is set', async () => {
      config.adminSecret = 'test-secret';
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/reset', { method: 'POST' });

      expect(res.status).toBe(401);
    });

    it('allows advance with correct secret in query param', async () => {
      config.adminSecret = 'test-secret';
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance?secret=test-secret', { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.currentPart).toBe(1);
    });

    it('allows reset with correct secret in query param', async () => {
      config.adminSecret = 'test-secret';
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/reset?secret=test-secret', { method: 'POST' });

      expect(res.status).toBe(200);
    });

    it('rejects advance with wrong secret', async () => {
      config.adminSecret = 'test-secret';
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/advance?secret=wrong', { method: 'POST' });

      expect(res.status).toBe(401);
    });

    it('does not protect status endpoint', async () => {
      config.adminSecret = 'test-secret';
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/status');

      expect(res.status).toBe(200);
      expect(res.body.currentPart).toBeDefined();
    });

    it('does not protect variant-status endpoint', async () => {
      config.adminSecret = 'test-secret';
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/variant-status');

      expect(res.status).toBe(200);
      expect(res.body.variants).toBeDefined();
    });
  });

  describe('synchronized variant loading', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      config.variantUrls = [];
      global.fetch = originalFetch;
    });

    it('story status includes ready: true by default', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/story/status');
      expect(res.body.ready).toBe(true);
    });

    it('admin status includes ready: true by default', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/status');
      expect(res.body.ready).toBe(true);
    });

    it('status shows ready: false when readyAt is in the future', async () => {
      const futureTimestamp = Date.now() + 60000;
      const app = buildApp(mockGenerator);
      await request(app, `/api/admin/advance?readyAt=${futureTimestamp}`, { method: 'POST' });
      const res = await request(app, '/api/story/status');
      expect(res.body.ready).toBe(false);
    });

    it('admin status shows ready: false when readyAt is in the future', async () => {
      const futureTimestamp = Date.now() + 60000;
      const app = buildApp(mockGenerator);
      await request(app, `/api/admin/advance?readyAt=${futureTimestamp}`, { method: 'POST' });
      const res = await request(app, '/api/admin/status');
      expect(res.body.ready).toBe(false);
      expect(res.body.readyAt).toBe(futureTimestamp);
    });

    it('status shows ready: true when advance has no readyAt', async () => {
      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });
      const res = await request(app, '/api/story/status');
      expect(res.body.ready).toBe(true);
    });

    it('reset clears readyAt so status shows ready: true', async () => {
      const futureTimestamp = Date.now() + 60000;
      const app = buildApp(mockGenerator);
      await request(app, `/api/admin/advance?readyAt=${futureTimestamp}`, { method: 'POST' });
      await request(app, '/api/admin/reset', { method: 'POST' });
      const res = await request(app, '/api/story/status');
      expect(res.body.ready).toBe(true);
    });

    it('advance forwards readyAt to variants when provided', async () => {
      const futureTimestamp = Date.now() + 5000;
      config.variantUrls = ['http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5 }),
      });

      const app = buildApp(mockGenerator);
      await request(app, `/api/admin/advance?readyAt=${futureTimestamp}`, { method: 'POST' });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toMatch(/readyAt=\d+/);
    });

    it('advance does not forward readyAt when not provided', async () => {
      config.variantUrls = ['http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5 }),
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/advance', { method: 'POST' });

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).not.toMatch(/readyAt/);
    });

    it('advance response includes readyAt from query param', async () => {
      const futureTimestamp = Date.now() + 5000;
      const app = buildApp(mockGenerator);
      const res = await request(app, `/api/admin/advance?readyAt=${futureTimestamp}`, { method: 'POST' });

      expect(res.body.readyAt).toBe(futureTimestamp);
    });

    it('coordinator still advances when variant fails', async () => {
      const futureTimestamp = Date.now() + 5000;
      config.variantUrls = ['http://unreachable:8080'];
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const app = buildApp(mockGenerator);
      const res = await request(app, `/api/admin/advance?readyAt=${futureTimestamp}`, { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.currentPart).toBe(1);
      expect(res.body.readyAt).toBe(futureTimestamp);
      expect(res.body.variants[0].ok).toBe(false);
    });

    it('coordinator still advances when variant times out', async () => {
      const futureTimestamp = Date.now() + 5000;
      config.variantUrls = ['http://slow:8080'];
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 50))
      );

      const app = buildApp(mockGenerator);
      const res = await request(app, `/api/admin/advance?readyAt=${futureTimestamp}`, { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.currentPart).toBe(1);
      expect(res.body.variants[0].ok).toBe(false);
      expect(res.body.variants[0].error).toMatch(/timeout/);
    });
  });

  describe('GET /admin/status includes style and round', () => {
    it('returns style and round in status response', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/status');

      expect(res.status).toBe(200);
      expect(res.body.style).toBe(config.variantStyle);
      expect(res.body.round).toBe(config.round);
    });
  });

  describe('variant status', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      config.variantUrls = [];
      config.variantLabels = [];
    });

    afterEach(() => {
      config.variantUrls = [];
      config.variantLabels = [];
      global.fetch = originalFetch;
    });

    it('returns empty variants array when no variant URLs configured', async () => {
      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/variant-status');

      expect(res.status).toBe(200);
      expect(res.body.variants).toEqual([]);
    });

    it('fetches status from each variant URL', async () => {
      config.variantUrls = ['http://app-1a:8080', 'http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ currentPart: 2, totalParts: 5, sessions: 10 }),
      });

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/variant-status');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith('http://app-1a:8080/api/admin/status');
      expect(global.fetch).toHaveBeenCalledWith('http://app-1b:8080/api/admin/status');
      expect(res.body.variants).toHaveLength(2);
      expect(res.body.variants[0]).toEqual({
        url: 'http://app-1a:8080',
        label: 'http://app-1a:8080',
        ok: true,
        currentPart: 2,
        totalParts: 5,
        sessions: 10,
      });
    });

    it('uses VARIANT_LABELS when available', async () => {
      config.variantUrls = ['http://app-1a:8080', 'http://app-1b:8080'];
      config.variantLabels = ['Round 1 Funny', 'Round 1 Dry'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5, sessions: 5 }),
      });

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/variant-status');

      expect(res.body.variants[0].label).toBe('Round 1 Funny');
      expect(res.body.variants[1].label).toBe('Round 1 Dry');
    });

    it('auto-generates label from variant style and round when no label configured', async () => {
      config.variantUrls = ['http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5, sessions: 3, style: 'funny', round: 1 }),
      });

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/variant-status');

      expect(res.body.variants[0].label).toBe('Round 1 Funny');
    });

    it('falls back to URL when no label and variant has no style/round', async () => {
      config.variantUrls = ['http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5, sessions: 3 }),
      });

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/variant-status');

      expect(res.body.variants[0].label).toBe('http://app-1b:8080');
    });

    it('handles variant failure gracefully', async () => {
      config.variantUrls = ['http://unreachable:8080'];
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/variant-status');

      expect(res.status).toBe(200);
      expect(res.body.variants).toHaveLength(1);
      expect(res.body.variants[0].ok).toBe(false);
      expect(res.body.variants[0].error).toMatch(/Connection refused/);
    });

    it('strips trailing slash from variant URLs', async () => {
      config.variantUrls = ['http://app-1b:8080/'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ currentPart: 1, totalParts: 5, sessions: 2 }),
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/variant-status');

      expect(global.fetch).toHaveBeenCalledWith('http://app-1b:8080/api/admin/status');
    });
  });

  describe('shared story pre-generation', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      config.variantUrls = [];
      global.fetch = originalFetch;
    });

    it('pre-generates all 5 parts and stores in shared story', async () => {
      let callCount = 0;
      mockGenerator.generatePart = vi.fn().mockImplementation((part) => {
        callCount++;
        return Promise.resolve({
          text: `Story part ${part} text`,
          responseId: `msg_part_${part}`,
          spanContext: { traceId: `trace_${part}`, spanId: `span_${part}`, traceFlags: 1 },
        });
      });

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/pre-generate', { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.generated).toBe(5);
      expect(res.body.totalParts).toBe(5);
      expect(mockGenerator.generatePart).toHaveBeenCalledTimes(5);
      for (let i = 1; i <= 5; i++) {
        expect(mockGenerator.generatePart).toHaveBeenCalledWith(
          i, config.variantStyle, config.variantModel, config.round
        );
        const shared = getSharedStory(i);
        expect(shared).toBeDefined();
        expect(shared.text).toBe(`Story part ${i} text`);
        expect(shared.responseId).toBe(`msg_part_${i}`);
      }
    });

    it('requires admin secret when ADMIN_SECRET is set', async () => {
      config.adminSecret = 'test-secret';
      const app = buildApp(mockGenerator);

      const res = await request(app, '/api/admin/pre-generate', { method: 'POST' });
      expect(res.status).toBe(401);

      const res2 = await request(app, '/api/admin/pre-generate?secret=test-secret', { method: 'POST' });
      expect(res2.status).toBe(200);

      config.adminSecret = '';
    });

    it('reports partial success when some parts fail', async () => {
      mockGenerator.generatePart = vi.fn().mockImplementation((part) => {
        if (part === 3) return Promise.reject(new Error('LLM overloaded'));
        return Promise.resolve({
          text: `Story part ${part} text`,
          responseId: `msg_part_${part}`,
          spanContext: { traceId: `trace_${part}`, spanId: `span_${part}`, traceFlags: 1 },
        });
      });

      const app = buildApp(mockGenerator);
      const res = await request(app, '/api/admin/pre-generate', { method: 'POST' });

      expect(res.status).toBe(200);
      expect(res.body.generated).toBe(4);
      expect(res.body.failed).toEqual([3]);
      expect(getSharedStory(1)).toBeDefined();
      expect(getSharedStory(3)).toBeUndefined();
    });

    it('reset clears shared story store', async () => {
      mockGenerator.generatePart = vi.fn().mockResolvedValue({
        text: 'Test story', responseId: 'msg_1', spanContext: null,
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/pre-generate', { method: 'POST' });
      expect(getSharedStory(1)).toBeDefined();

      await request(app, '/api/admin/reset', { method: 'POST' });
      expect(getSharedStory(1)).toBeUndefined();
    });

    it('admin status includes sharedStory generation state', async () => {
      mockGenerator.generatePart = vi.fn().mockResolvedValue({
        text: 'Test story', responseId: 'msg_1', spanContext: null,
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/pre-generate', { method: 'POST' });
      const res = await request(app, '/api/admin/status');

      expect(res.body.sharedStoryParts).toEqual([1, 2, 3, 4, 5]);
    });

    it('forwards pre-generate to variant URLs', async () => {
      config.variantUrls = ['http://app-1b:8080'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ generated: 5, totalParts: 5, failed: [] }),
      });

      const app = buildApp(mockGenerator);
      await request(app, '/api/admin/pre-generate', { method: 'POST' });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toBe('http://app-1b:8080/api/admin/pre-generate');
    });
  });
});

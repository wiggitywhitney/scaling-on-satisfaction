// ABOUTME: API routes for story delivery, voting, and presenter admin controls
// ABOUTME: Handles story generation, OTel vote events, and multi-variant advancement
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TOTAL_PARTS } from '../story/prompts.js';
import config from '../config.js';
import { emitEvaluationEvent } from '../telemetry.js';

const sessions = new Map();
let currentPart = 0;

export function getCurrentPart() {
  return currentPart;
}

export function resetState() {
  sessions.clear();
  currentPart = 0;
}

function getSession(req, res) {
  let sessionId = req.cookies.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    sessionId = uuidv4();
    res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'lax' });
    sessions.set(sessionId, { parts: {} });
  }
  return { sessionId, session: sessions.get(sessionId) };
}

export function createApiRouter(generator) {
  const router = Router();

  router.get('/story/status', (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionId ? sessions.get(sessionId) : null;
    const generatedParts = session
      ? Object.keys(session.parts).map(Number).sort((a, b) => a - b)
      : [];
    res.json({ totalParts: TOTAL_PARTS, generatedParts, currentPart });
  });

  router.get('/story/:part', async (req, res) => {
    const partNumber = parseInt(req.params.part, 10);

    if (isNaN(partNumber)) {
      return res.status(400).json({ error: 'Part must be a number' });
    }

    if (partNumber < 1 || partNumber > TOTAL_PARTS) {
      return res.status(404).json({ error: `Part ${partNumber} not found. Valid range: 1-${TOTAL_PARTS}` });
    }

    if (partNumber > currentPart) {
      return res.status(403).json({ error: 'This part is not available yet', currentPart });
    }

    const { session } = getSession(req, res);

    if (session.parts[partNumber]) {
      return res.json({
        part: partNumber,
        totalParts: TOTAL_PARTS,
        text: session.parts[partNumber].text,
        vote: session.parts[partNumber].vote || null,
      });
    }

    try {
      const genStart = Date.now();
      const result = await generator.generatePart(
        partNumber,
        config.variantStyle,
        config.variantModel,
        config.round
      );

      if (config.minGenerationDelayMs > 0) {
        const elapsed = Date.now() - genStart;
        const remaining = config.minGenerationDelayMs - elapsed;
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
      }

      session.parts[partNumber] = result;

      res.json({
        part: partNumber,
        totalParts: TOTAL_PARTS,
        text: result.text,
        vote: session.parts[partNumber].vote || null,
      });
    } catch (err) {
      res.status(500).json({ error: `Failed to generate story part: ${err.message}` });
    }
  });

  const VALID_VOTES = ['thumbs_up', 'thumbs_down'];

  router.post('/story/:part/vote', (req, res) => {
    const partNumber = parseInt(req.params.part, 10);

    if (isNaN(partNumber)) {
      return res.status(400).json({ error: 'Part must be a number' });
    }

    if (partNumber < 1 || partNumber > TOTAL_PARTS) {
      return res.status(404).json({ error: `Part ${partNumber} not found. Valid range: 1-${TOTAL_PARTS}` });
    }

    if (partNumber > currentPart) {
      return res.status(403).json({ error: 'This part is not available yet', currentPart });
    }

    const { vote } = req.body || {};

    if (!vote || !VALID_VOTES.includes(vote)) {
      return res.status(400).json({ error: 'Vote must be thumbs_up or thumbs_down' });
    }

    const { session } = getSession(req, res);

    if (!session.parts[partNumber]) {
      return res.status(400).json({ error: 'Part not generated for this session' });
    }

    if (session.parts[partNumber].vote) {
      return res.status(409).json({ error: 'Already voted on this part' });
    }

    session.parts[partNumber].vote = vote;

    emitEvaluationEvent({
      vote,
      responseId: session.parts[partNumber].responseId,
      generationSpanContext: session.parts[partNumber].spanContext || null,
    });

    res.json({
      part: partNumber,
      vote,
      responseId: session.parts[partNumber].responseId,
    });
  });

  return router;
}

async function forwardToVariants(path, secret) {
  const results = [];
  for (const baseUrl of config.variantUrls) {
    let url = `${baseUrl.replace(/\/$/, '')}/api/admin/${path}`;
    if (secret) {
      url += `?secret=${encodeURIComponent(secret)}`;
    }
    try {
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      results.push({ url: baseUrl, ok: res.ok, status: res.status, ...data });
    } catch (err) {
      results.push({ url: baseUrl, ok: false, error: err.message });
    }
  }
  return results;
}

function requireSecret(req, res, next) {
  if (!config.adminSecret) return next();
  const provided = req.query.secret || '';
  if (provided === config.adminSecret) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

export function createAdminRouter() {
  const router = Router();

  router.post('/advance', requireSecret, async (req, res) => {
    if (currentPart >= TOTAL_PARTS) {
      return res.status(400).json({ error: 'Already at the last part', currentPart });
    }
    currentPart++;
    const variants = await forwardToVariants('advance', req.query.secret);
    res.json({ currentPart, totalParts: TOTAL_PARTS, variants });
  });

  router.post('/reset', requireSecret, async (req, res) => {
    currentPart = 0;
    sessions.clear();
    const variants = await forwardToVariants('reset', req.query.secret);
    res.json({ currentPart, totalParts: TOTAL_PARTS, variants });
  });

  router.get('/status', (req, res) => {
    res.json({
      currentPart,
      totalParts: TOTAL_PARTS,
      sessions: sessions.size,
      style: config.variantStyle,
      round: config.round,
    });
  });

  router.get('/variant-status', async (req, res) => {
    const variants = [];
    for (let i = 0; i < config.variantUrls.length; i++) {
      const baseUrl = config.variantUrls[i];
      const explicitLabel = config.variantLabels && config.variantLabels[i];
      const url = `${baseUrl.replace(/\/$/, '')}/api/admin/status`;
      try {
        const fetchRes = await fetch(url);
        const data = await fetchRes.json();
        const label = explicitLabel
          || (data.style ? `Round ${data.round} ${data.style.charAt(0).toUpperCase() + data.style.slice(1)}` : baseUrl);
        variants.push({ url: baseUrl, label, ok: true, ...data });
      } catch (err) {
        const label = explicitLabel || baseUrl;
        variants.push({ url: baseUrl, label, ok: false, error: err.message });
      }
    }
    res.json({ variants });
  });

  return router;
}

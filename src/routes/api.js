// ABOUTME: API routes for story delivery, voting, and presenter admin controls
// ABOUTME: Handles story generation, OTel vote events, and multi-variant advancement
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TOTAL_PARTS } from '../story/prompts.js';
import config from '../config.js';
import { emitEvaluationEvent } from '../telemetry.js';

const sessions = new Map();
const sharedStory = new Map();
const inFlightGenerations = new Map();
let currentPart = 0;
let readyAt = 0;

export function getCurrentPart() {
  return currentPart;
}

export function getSharedStory(partNumber) {
  return sharedStory.get(partNumber);
}

export function resetState() {
  sessions.clear();
  sharedStory.clear();
  inFlightGenerations.clear();
  currentPart = 0;
  readyAt = 0;
}

function isReady() {
  return readyAt === 0 || Date.now() >= readyAt;
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

  router.post('/story/warmup', (req, res) => {
    const { session } = getSession(req, res);
    res.json({ warming: true });

    // Eagerly generate part 1 in the background after stagger delay (skip if shared story exists)
    if (!sharedStory.has(1) && !inFlightGenerations.has(1)) {
      const delay = config.pregenDelayMs;
      const generate = () => {
        const genPromise = generator.generatePart(1, config.variantStyle, config.variantModel, config.round);
        inFlightGenerations.set(1, genPromise);
        genPromise
          .then(result => {
            if (!sharedStory.has(1)) {
              sharedStory.set(1, result);
            }
          })
          .catch(err => {
            console.error(`Pre-generation failed for part 1 (warmup): ${err.message}`);
            // Retry once after delay
            setTimeout(() => {
              generator.generatePart(1, config.variantStyle, config.variantModel, config.round)
                .then(result => {
                  if (!sharedStory.has(1)) {
                    sharedStory.set(1, result);
                  }
                })
                .catch(retryErr => {
                  console.error(`Pre-generation retry failed for part 1 (warmup): ${retryErr.message}`);
                });
            }, config.pregenRetryDelayMs);
          })
          .finally(() => inFlightGenerations.delete(1));
      };

      if (delay > 0) {
        setTimeout(generate, delay);
      } else {
        generate();
      }
    }
  });

  router.get('/story/status', (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionId ? sessions.get(sessionId) : null;
    const generatedParts = session
      ? Object.keys(session.parts).map(Number).sort((a, b) => a - b)
      : [];
    res.json({ totalParts: TOTAL_PARTS, generatedParts, currentPart, ready: isReady() });
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

    // Check session cache first
    if (session.parts[partNumber]) {
      return res.json({
        part: partNumber,
        totalParts: TOTAL_PARTS,
        text: session.parts[partNumber].text,
        vote: session.parts[partNumber].vote || null,
      });
    }

    // Check shared pre-generated store
    const shared = sharedStory.get(partNumber);
    if (shared) {
      session.parts[partNumber] = { ...shared };
      return res.json({
        part: partNumber,
        totalParts: TOTAL_PARTS,
        text: shared.text,
        vote: null,
      });
    }

    // Fallback: generate on demand with in-flight deduplication
    try {
      let resultPromise = inFlightGenerations.get(partNumber);
      if (!resultPromise) {
        resultPromise = generator.generatePart(
          partNumber,
          config.variantStyle,
          config.variantModel,
          config.round
        );
        inFlightGenerations.set(partNumber, resultPromise);
        resultPromise.catch(() => {}).finally(() => inFlightGenerations.delete(partNumber));
      }

      const genStart = Date.now();
      const result = await resultPromise;

      // Store in shared store so all users get the same story
      if (!sharedStory.has(partNumber)) {
        sharedStory.set(partNumber, result);
      }

      if (config.minGenerationDelayMs > 0) {
        const elapsed = Date.now() - genStart;
        const remaining = config.minGenerationDelayMs - elapsed;
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
      }

      session.parts[partNumber] = { ...result };

      res.json({
        part: partNumber,
        totalParts: TOTAL_PARTS,
        text: result.text,
        vote: null,
      });

      // Eagerly pre-generate the next part in the background after stagger delay
      const nextPart = partNumber + 1;
      if (nextPart <= TOTAL_PARTS && !sharedStory.has(nextPart) && !inFlightGenerations.has(nextPart)) {
        const generate = () => {
          const genPromise = generator.generatePart(nextPart, config.variantStyle, config.variantModel, config.round);
          inFlightGenerations.set(nextPart, genPromise);
          genPromise
            .then(nextResult => {
              if (!sharedStory.has(nextPart)) {
                sharedStory.set(nextPart, nextResult);
              }
            })
            .catch(err => {
              console.error(`Pre-generation failed for part ${nextPart}: ${err.message}`);
              // Retry once after delay
              setTimeout(() => {
                generator.generatePart(nextPart, config.variantStyle, config.variantModel, config.round)
                  .then(nextResult => {
                    if (!sharedStory.has(nextPart)) {
                      sharedStory.set(nextPart, nextResult);
                    }
                  })
                  .catch(retryErr => {
                    console.error(`Pre-generation retry failed for part ${nextPart}: ${retryErr.message}`);
                  });
              }, config.pregenRetryDelayMs);
            })
            .finally(() => inFlightGenerations.delete(nextPart));
        };

        if (config.pregenDelayMs > 0) {
          setTimeout(generate, config.pregenDelayMs);
        } else {
          generate();
        }
      }
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

async function forwardToVariants(path, secret, forwardReadyAt) {
  const results = [];
  for (const baseUrl of config.variantUrls) {
    let url = `${baseUrl.replace(/\/$/, '')}/api/admin/${path}`;
    const params = [];
    if (secret) params.push(`secret=${encodeURIComponent(secret)}`);
    if (forwardReadyAt) params.push(`readyAt=${forwardReadyAt}`);
    if (params.length > 0) url += `?${params.join('&')}`;
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

export function createAdminRouter(generator) {
  const router = Router();

  router.post('/pre-generate', requireSecret, async (req, res) => {
    const failed = [];
    let generated = 0;

    for (let part = 1; part <= TOTAL_PARTS; part++) {
      try {
        const result = await generator.generatePart(
          part, config.variantStyle, config.variantModel, config.round
        );
        sharedStory.set(part, result);
        generated++;
        console.log(`Pre-generated part ${part}/${TOTAL_PARTS}`);
      } catch (err) {
        console.error(`Pre-generation failed for part ${part}: ${err.message}`);
        failed.push(part);
      }
    }

    // Forward to variant URLs
    const variants = await forwardToVariants('pre-generate', req.query.secret);

    res.json({ generated, totalParts: TOTAL_PARTS, failed, variants });
  });

  router.post('/advance', requireSecret, async (req, res) => {
    if (currentPart >= TOTAL_PARTS) {
      return res.status(400).json({ error: 'Already at the last part', currentPart });
    }

    const providedReadyAt = req.query.readyAt ? parseInt(req.query.readyAt, 10) : null;
    readyAt = providedReadyAt || 0;

    currentPart++;
    const variants = await forwardToVariants('advance', req.query.secret, readyAt);
    res.json({ currentPart, totalParts: TOTAL_PARTS, readyAt, variants });
  });

  router.post('/reset', requireSecret, async (req, res) => {
    currentPart = 0;
    readyAt = 0;
    sessions.clear();
    sharedStory.clear();
    inFlightGenerations.clear();
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
      ready: isReady(),
      readyAt,
      sharedStoryParts: [...sharedStory.keys()].sort((a, b) => a - b),
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
        if (!fetchRes.ok) {
          throw new Error(`status ${fetchRes.status}`);
        }
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

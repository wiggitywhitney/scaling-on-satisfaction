import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import config from './config.js';
import { createGenerator } from './story/generator.js';
import { createApiRouter, createAdminRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic({ apiKey: config.anthropicApiKey });
const generator = createGenerator(client);

const app = express();
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));
app.use(express.json());
app.use('/api', createApiRouter(generator));
app.use('/api/admin', createAdminRouter());
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin.html'));
});

app.listen(config.port, () => {
  console.log(`Story app listening on port ${config.port}`);
  console.log(`  Round: ${config.round}`);
  console.log(`  Style: ${config.variantStyle}`);
  console.log(`  Model: ${config.variantModel}`);
});

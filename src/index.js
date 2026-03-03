// ABOUTME: Entry point for the story app server
// ABOUTME: Starts Express, wires up Anthropic client, and handles graceful shutdown
import Anthropic from '@anthropic-ai/sdk';
import config from './config.js';
import { createGenerator } from './story/generator.js';
import { createApp } from './app.js';

if (!config.anthropicApiKey) {
  console.error('FATAL: ANTHROPIC_API_KEY is not set. Exiting.');
  process.exit(1);
}

const client = new Anthropic({ apiKey: config.anthropicApiKey });
const generator = createGenerator(client);

const { app, shutdown } = createApp(generator);

const server = app.listen(config.port, () => {
  console.log(`Story app listening on port ${config.port}`); // eslint-disable-line no-console
  console.log(`  Round: ${config.round}`); // eslint-disable-line no-console
  console.log(`  Style: ${config.variantStyle}`); // eslint-disable-line no-console
  console.log(`  Model: ${config.variantModel}`); // eslint-disable-line no-console
});

function gracefulShutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`); // eslint-disable-line no-console
  shutdown.begin();
  server.close(() => {
    console.log('All connections drained, exiting.'); // eslint-disable-line no-console
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

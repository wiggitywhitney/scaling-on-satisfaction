import Anthropic from '@anthropic-ai/sdk';
import config from './config.js';
import { createGenerator } from './story/generator.js';
import { createApp } from './app.js';

const client = new Anthropic({ apiKey: config.anthropicApiKey });
const generator = createGenerator(client);

const { app, shutdown } = createApp(generator);

const server = app.listen(config.port, () => {
  console.log(`Story app listening on port ${config.port}`);
  console.log(`  Round: ${config.round}`);
  console.log(`  Style: ${config.variantStyle}`);
  console.log(`  Model: ${config.variantModel}`);
});

function gracefulShutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  shutdown.begin();
  server.close(() => {
    console.log('All connections drained, exiting.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

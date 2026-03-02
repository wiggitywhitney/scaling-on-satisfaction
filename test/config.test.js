import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear cached module between tests
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses default values when env vars are not set', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const { default: config } = await import('../src/config.js?' + Date.now());
    expect(config.port).toBe(8080);
    expect(config.variantStyle).toBe('funny');
    expect(config.variantModel).toBe('claude-sonnet-4-20250514');
    expect(config.round).toBe(1);
  });

  it('reads PORT from environment', async () => {
    process.env.PORT = '8080';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const { default: config } = await import('../src/config.js?' + Date.now());
    expect(config.port).toBe(8080);
  });

  it('reads VARIANT_STYLE from environment', async () => {
    process.env.VARIANT_STYLE = 'dry';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const { default: config } = await import('../src/config.js?' + Date.now());
    expect(config.variantStyle).toBe('dry');
  });

  it('reads VARIANT_MODEL from environment', async () => {
    process.env.VARIANT_MODEL = 'claude-haiku-4-5-20251001';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const { default: config } = await import('../src/config.js?' + Date.now());
    expect(config.variantModel).toBe('claude-haiku-4-5-20251001');
  });

  it('reads ROUND from environment', async () => {
    process.env.ROUND = '2';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const { default: config } = await import('../src/config.js?' + Date.now());
    expect(config.round).toBe(2);
  });

  it('reads ANTHROPIC_API_KEY from environment', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    const { default: config } = await import('../src/config.js?' + Date.now());
    expect(config.anthropicApiKey).toBe('sk-ant-test-key');
  });

  it('defaults variantUrls to empty array', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const { default: config } = await import('../src/config.js?' + Date.now());
    expect(config.variantUrls).toEqual([]);
  });

  it('parses VARIANT_URLS as comma-separated list', async () => {
    process.env.VARIANT_URLS = 'http://app-1a:8080,http://app-1b:8080';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const { default: config } = await import('../src/config.js?' + Date.now());
    expect(config.variantUrls).toEqual(['http://app-1a:8080', 'http://app-1b:8080']);
  });

  it('trims whitespace from VARIANT_URLS entries', async () => {
    process.env.VARIANT_URLS = ' http://app-1a:8080 , http://app-1b:8080 ';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const { default: config } = await import('../src/config.js?' + Date.now());
    expect(config.variantUrls).toEqual(['http://app-1a:8080', 'http://app-1b:8080']);
  });
});

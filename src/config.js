// ABOUTME: App configuration loaded from environment variables
// ABOUTME: Covers port, round, variant style/model, API keys, and admin settings
function parseNonNegativeInt(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null || raw === '') return defaultValue;
  if (!/^\d+$/.test(raw)) {
    throw new Error(`Invalid ${name}: "${raw}" — must be a non-negative integer`);
  }
  return parseInt(raw, 10);
}

function loadConfig() {
  const variantUrls = process.env.VARIANT_URLS
    ? process.env.VARIANT_URLS.split(',').map(u => u.trim()).filter(Boolean)
    : [];

  const variantLabels = process.env.VARIANT_LABELS
    ? process.env.VARIANT_LABELS.split(',').map(l => l.trim()).filter(Boolean)
    : [];

  return {
    port: parseInt(process.env.PORT || '8080', 10),
    variantStyle: process.env.VARIANT_STYLE || 'funny',
    variantModel: process.env.VARIANT_MODEL || 'claude-sonnet-4-20250514',
    round: parseInt(process.env.ROUND || '1', 10),
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    variantUrls,
    variantLabels,
    adminSecret: process.env.ADMIN_SECRET || '',
    pregenDelayMs: parseNonNegativeInt('PREGEN_DELAY_MS', 2000),
    pregenRetryDelayMs: parseNonNegativeInt('PREGEN_RETRY_DELAY_MS', 5000),
  };
}

export default loadConfig();

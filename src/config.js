// ABOUTME: App configuration loaded from environment variables
// ABOUTME: Covers port, round, variant style/model, API keys, and admin settings
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
    minGenerationDelayMs: parseInt(process.env.MIN_GENERATION_DELAY_MS || '0', 10),
    pregenDelayMs: parseInt(process.env.PREGEN_DELAY_MS || '2000', 10),
    pregenRetryDelayMs: parseInt(process.env.PREGEN_RETRY_DELAY_MS || '5000', 10),
  };
}

export default loadConfig();

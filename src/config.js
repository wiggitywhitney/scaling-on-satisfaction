function loadConfig() {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    variantStyle: process.env.VARIANT_STYLE || 'funny',
    variantModel: process.env.VARIANT_MODEL || 'claude-sonnet-4-20250514',
    round: parseInt(process.env.ROUND || '1', 10),
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  };
}

export default loadConfig();

import { buildPrompt } from './prompts.js';

export function createGenerator(client) {
  return {
    async generatePart(partNumber, style, model) {
      const prompt = buildPrompt(partNumber, style);

      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
      });

      return {
        text: response.content[0].text,
        responseId: response.id,
      };
    },
  };
}

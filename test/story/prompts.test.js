import { describe, it, expect } from 'vitest';
import { buildPrompt, TOTAL_PARTS } from '../../src/story/prompts.js';

describe('prompts', () => {
  describe('TOTAL_PARTS', () => {
    it('is 5', () => {
      expect(TOTAL_PARTS).toBe(5);
    });
  });

  describe('buildPrompt', () => {
    it('returns an object with system and user messages', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt).toHaveProperty('system');
      expect(prompt).toHaveProperty('user');
      expect(typeof prompt.system).toBe('string');
      expect(typeof prompt.user).toBe('string');
    });

    it('builds a valid prompt for each of the 5 parts', () => {
      for (let part = 1; part <= 5; part++) {
        const prompt = buildPrompt(part, 'funny');
        expect(prompt.system.length).toBeGreaterThan(0);
        expect(prompt.user.length).toBeGreaterThan(0);
      }
    });

    it('includes gender-neutral constraint in system message', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt.system).toMatch(/gender.neutral|they|the platform engineer/i);
    });

    it('includes word count constraint in system message', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt.system).toMatch(/150/);
    });

    it('bans "Houston, we have a problem"', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt.system).toMatch(/houston.*banned/i);
    });

    it('instructs to lead with physical reality', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt.system).toMatch(/physically happening/i);
    });

    it('includes funny style instruction for funny variant', () => {
      const prompt = buildPrompt(1, 'funny');
      const combined = prompt.system + ' ' + prompt.user;
      expect(combined).toMatch(/funny|engaging|humorous|humor/i);
    });

    it('includes dry style instruction for dry variant', () => {
      const prompt = buildPrompt(1, 'dry');
      const combined = prompt.system + ' ' + prompt.user;
      expect(combined).toMatch(/dry|academic|formal|paper/i);
    });

    it('changes content based on style parameter', () => {
      const funny = buildPrompt(1, 'funny');
      const dry = buildPrompt(1, 'dry');
      // At least one of system or user should differ
      const funnyContent = funny.system + funny.user;
      const dryContent = dry.system + dry.user;
      expect(funnyContent).not.toBe(dryContent);
    });

    it('part 1 mentions moon and setup', () => {
      const prompt = buildPrompt(1, 'funny');
      const content = prompt.user;
      expect(content).toMatch(/moon/i);
      expect(content).toMatch(/mystery|mission|platform/i);
    });

    it('part 2 mentions floating servers and low gravity', () => {
      const prompt = buildPrompt(2, 'funny');
      const content = prompt.user;
      expect(content).toMatch(/float|drift|gravity/i);
      expect(content).toMatch(/server/i);
    });

    it('part 3 mentions CI/CD and Earth distance', () => {
      const prompt = buildPrompt(3, 'funny');
      const content = prompt.user;
      expect(content).toMatch(/ci.cd|pipeline|build/i);
      expect(content).toMatch(/earth|384.000|distance|delay/i);
    });

    it('part 4 requires solving both problems and loneliness', () => {
      const prompt = buildPrompt(4, 'funny');
      const content = prompt.user;
      expect(content).toMatch(/solves? both/i);
      expect(content).toMatch(/nobody|lonely|alone|satisfaction survey/i);
    });

    it('part 5 mentions aliens and happy ending', () => {
      const prompt = buildPrompt(5, 'funny');
      const content = prompt.user;
      expect(content).toMatch(/alien/i);
      expect(content).toMatch(/happy|appreciation|reveal/i);
    });

    it('includes prior context for parts 2-5', () => {
      for (let part = 2; part <= 5; part++) {
        const prompt = buildPrompt(part, 'funny');
        const content = prompt.user;
        // Prior context should reference earlier beats
        expect(content).toMatch(/previously|so far|prior|earlier|part/i);
      }
    });

    it('part 1 has no prior context', () => {
      const prompt = buildPrompt(1, 'funny');
      // Part 1 shouldn't reference "previously" or "so far"
      expect(prompt.user).not.toMatch(/previously happened|story so far/i);
    });

    it('throws for invalid part numbers', () => {
      expect(() => buildPrompt(0, 'funny')).toThrow();
      expect(() => buildPrompt(6, 'funny')).toThrow();
      expect(() => buildPrompt(-1, 'funny')).toThrow();
    });
  });
});

// ABOUTME: Tests for story bible prompt construction across Round 1 and Round 2 variants
// ABOUTME: Verifies beat content, style instructions, and continuity details in prompts
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
      expect(prompt.system).toMatch(/100/);
    });

    it('bans "Houston, we have a problem"', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt.system).toMatch(/never.*houston/i);
    });

    it('references Douglas Adams style in funny variant', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt.system).toMatch(/Douglas Adams/i);
    });

    it('limits similes in funny style to one per part', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt.system).toMatch(/simile/i);
      expect(prompt.system).toMatch(/one.*per part|one per part/i);
    });

    it('requires bridging sentence for parts 2-5', () => {
      for (let part = 2; part <= 5; part++) {
        const prompt = buildPrompt(part, 'funny');
        expect(prompt.system).toMatch(/bridg/i);
      }
    });

    it('does not require bridging sentence for part 1', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt.system).toMatch(/for parts after the first/i);
    });

    it('instructs to lead with physical reality', () => {
      const prompt = buildPrompt(1, 'funny');
      expect(prompt.system).toMatch(/physically happening/i);
    });

    it('includes funny style instruction for funny variant', () => {
      const prompt = buildPrompt(1, 'funny');
      const combined = prompt.system + ' ' + prompt.user;
      expect(combined).toMatch(/Douglas Adams|dry wit|absurdity/i);
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
      expect(content).toMatch(/earth|384[,.]?000|distance|delay/i);
    });

    it('part 4 requires solving both problems and loneliness', () => {
      const prompt = buildPrompt(4, 'funny');
      const content = prompt.user;
      expect(content).toMatch(/solves? both|fixing these two|tackle both|restate the two problems/i);
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

    it('includes Nyx Vasquez character in round 1 funny prompts', () => {
      const prompt = buildPrompt(1, 'funny');
      const content = prompt.system + ' ' + prompt.user;
      expect(content).toMatch(/Nyx/i);
    });

    it('includes Nyx Vasquez character in round 1 dry prompts', () => {
      const prompt = buildPrompt(1, 'dry');
      const content = prompt.system + ' ' + prompt.user;
      expect(content).toMatch(/Nyx/i);
    });

    it('uses Nyx consistently across all round 1 parts', () => {
      for (let part = 1; part <= 5; part++) {
        const funny = buildPrompt(part, 'funny');
        const dry = buildPrompt(part, 'dry');
        expect(funny.system + ' ' + funny.user).toMatch(/Nyx/i);
        expect(dry.system + ' ' + dry.user).toMatch(/Nyx/i);
      }
    });

    it('throws for invalid part numbers', () => {
      expect(() => buildPrompt(0, 'funny')).toThrow();
      expect(() => buildPrompt(6, 'funny')).toThrow();
      expect(() => buildPrompt(-1, 'funny')).toThrow();
      expect(() => buildPrompt(1.5, 'funny')).toThrow(/Invalid part number/);
      expect(() => buildPrompt(NaN, 'funny')).toThrow(/Invalid part number/);
    });

    it('throws for invalid round', () => {
      expect(() => buildPrompt(1, 'funny', 3)).toThrow(/Invalid round/);
      expect(() => buildPrompt(1, 'funny', 0)).toThrow(/Invalid round/);
    });

    it('throws for invalid style in round 1', () => {
      expect(() => buildPrompt(1, 'nonexistent', 1)).toThrow(/Invalid style/);
    });

    it('accepts any style in round 2 (always uses funny)', () => {
      const result = buildPrompt(1, 'dramatic', 2);
      expect(result.system).toMatch(/Douglas Adams/);
    });

    it('defaults to round 1 when round not specified', () => {
      const withDefault = buildPrompt(1, 'funny');
      const explicit = buildPrompt(1, 'funny', 1);
      expect(withDefault.system).toBe(explicit.system);
      expect(withDefault.user).toBe(explicit.user);
    });
  });

  describe('buildPrompt round 2', () => {
    it('builds a valid prompt for each of the 5 parts', () => {
      for (let part = 1; part <= 5; part++) {
        const prompt = buildPrompt(part, 'funny', 2);
        expect(prompt.system.length).toBeGreaterThan(0);
        expect(prompt.user.length).toBeGreaterThan(0);
      }
    });

    it('uses funny style regardless of style parameter', () => {
      const funny = buildPrompt(1, 'funny', 2);
      const dry = buildPrompt(1, 'dry', 2);
      expect(funny.system).toBe(dry.system);
      expect(funny.user).toBe(dry.user);
    });

    it('includes "Clown Native Computing Foundation" in system message', () => {
      const prompt = buildPrompt(1, 'funny', 2);
      expect(prompt.system).toMatch(/Clown Native Computing Foundation/);
    });

    it('limits similes in round 2 funny style to one per part', () => {
      const prompt = buildPrompt(1, 'funny', 2);
      expect(prompt.system).toMatch(/simile/i);
      expect(prompt.system).toMatch(/one per part/i);
    });

    it('requires bridging sentence for round 2 parts 2-5', () => {
      for (let part = 2; part <= 5; part++) {
        const prompt = buildPrompt(part, 'funny', 2);
        expect(prompt.system).toMatch(/bridg/i);
      }
    });

    it('includes gender-neutral constraint for all characters', () => {
      const prompt = buildPrompt(1, 'funny', 2);
      expect(prompt.system).toMatch(/gender.neutral/i);
      expect(prompt.system).toMatch(/they/i);
    });

    it('includes word count constraint', () => {
      const prompt = buildPrompt(1, 'funny', 2);
      expect(prompt.system).toMatch(/100/);
    });

    it('instructs to lead with physical reality', () => {
      const prompt = buildPrompt(1, 'funny', 2);
      expect(prompt.system).toMatch(/physically happening/i);
    });

    it('includes Douglas Adams style instruction', () => {
      const prompt = buildPrompt(1, 'funny', 2);
      expect(prompt.system).toMatch(/Douglas Adams/);
    });

    it('round 2 content differs from round 1', () => {
      const r1 = buildPrompt(1, 'funny', 1);
      const r2 = buildPrompt(1, 'funny', 2);
      expect(r2.system).not.toBe(r1.system);
      expect(r2.user).not.toBe(r1.user);
    });

    it('part 1 mentions circus, tank, and developer', () => {
      const prompt = buildPrompt(1, 'funny', 2);
      const content = prompt.system + ' ' + prompt.user;
      expect(content).toMatch(/circus/i);
      expect(content).toMatch(/tank/i);
      expect(content).toMatch(/developer/i);
    });

    it('part 2 mentions cannonball, Helm, and service mesh', () => {
      const prompt = buildPrompt(2, 'funny', 2);
      const content = prompt.user;
      expect(content).toMatch(/cannonball/i);
      expect(content).toMatch(/helm/i);
      expect(content).toMatch(/service mesh/i);
    });

    it('part 3 mentions trapeze, Flux, and Kyverno', () => {
      const prompt = buildPrompt(3, 'funny', 2);
      const content = prompt.user;
      expect(content).toMatch(/trapeze/i);
      expect(content).toMatch(/flux/i);
      expect(content).toMatch(/kyverno/i);
    });

    it('part 4 mentions clown car, Kubernetes API, and interfaces', () => {
      const prompt = buildPrompt(4, 'funny', 2);
      const content = prompt.user;
      expect(content).toMatch(/clown car/i);
      expect(content).toMatch(/kubernetes api/i);
      expect(content).toMatch(/interface/i);
    });

    it('part 5 mentions deploy, celebration, and Clown Native Computing Foundation', () => {
      const prompt = buildPrompt(5, 'funny', 2);
      const content = prompt.user;
      expect(content).toMatch(/deploy/i);
      expect(content).toMatch(/Clown Native Computing Foundation/);
    });

    it('includes prior context for parts 2-5', () => {
      for (let part = 2; part <= 5; part++) {
        const prompt = buildPrompt(part, 'funny', 2);
        expect(prompt.user).toMatch(/story so far/i);
      }
    });

    it('part 1 has no prior context', () => {
      const prompt = buildPrompt(1, 'funny', 2);
      expect(prompt.user).not.toMatch(/story so far/i);
    });

    it('tracks physical escalation across parts', () => {
      const p2 = buildPrompt(2, 'funny', 2).user;
      const p3 = buildPrompt(3, 'funny', 2).user;
      const p4 = buildPrompt(4, 'funny', 2).user;
      expect(p2).toMatch(/breath|chest|air supply/i);
      expect(p3).toMatch(/lightheaded|struggling/i);
      expect(p4).toMatch(/near death|black out|consciousness/i);
    });

    it('includes Rae Okonkwo character in round 2 funny prompts', () => {
      const prompt = buildPrompt(1, 'funny', 2);
      const content = prompt.system + ' ' + prompt.user;
      expect(content).toMatch(/Rae/i);
    });

    it('uses Rae consistently across all round 2 parts', () => {
      for (let part = 1; part <= 5; part++) {
        const prompt = buildPrompt(part, 'funny', 2);
        expect(prompt.system + ' ' + prompt.user).toMatch(/Rae/i);
      }
    });

    it('throws for invalid part numbers in round 2', () => {
      expect(() => buildPrompt(0, 'funny', 2)).toThrow();
      expect(() => buildPrompt(6, 'funny', 2)).toThrow();
    });
  });
});

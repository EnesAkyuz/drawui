import { describe, it, expect } from 'vitest';
import { createGeminiPrompt, validateGeminiResponse } from '../gemini';

describe('gemini', () => {
  describe('createGeminiPrompt', () => {
    it('should create prompt with available components', () => {
      const components = ['button', 'input', 'card'];
      const prompt = createGeminiPrompt(components);

      expect(prompt).toContain('button');
      expect(prompt).toContain('input');
      expect(prompt).toContain('card');
      expect(prompt).toContain('JSON');
    });

    it('should include instructions for empty response', () => {
      const prompt = createGeminiPrompt(['button']);

      expect(prompt).toContain('[]');
      expect(prompt).toContain('empty array');
    });
  });

  describe('validateGeminiResponse', () => {
    it('should accept valid component response', () => {
      const response = [
        {
          type: 'button',
          position: { x: 10, y: 20, width: 100, height: 40 },
          props: { variant: 'default' }
        }
      ];

      const result = validateGeminiResponse(response);

      expect(result).toBe(true);
    });

    it('should accept empty array', () => {
      const result = validateGeminiResponse([]);

      expect(result).toBe(true);
    });

    it('should reject invalid position', () => {
      const response = [
        {
          type: 'button',
          position: { x: 10, y: 20 }, // missing width/height
          props: {}
        }
      ];

      const result = validateGeminiResponse(response);

      expect(result).toBe(false);
    });

    it('should reject missing type', () => {
      const response = [
        {
          position: { x: 10, y: 20, width: 100, height: 40 },
          props: {}
        }
      ];

      const result = validateGeminiResponse(response);

      expect(result).toBe(false);
    });
  });
});

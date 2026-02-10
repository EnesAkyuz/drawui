import { describe, it, expect } from 'vitest';
import { deduplicateComponents, isSimilarPosition, mergeComponents } from '../component-mapper';
import type { GeneratedComponent, GeminiComponentResponse } from '@/types/canvas';

describe('component-mapper', () => {
  describe('isSimilarPosition', () => {
    it('should detect similar positions within threshold', () => {
      const pos1 = { x: 100, y: 100, width: 200, height: 50 };
      const pos2 = { x: 105, y: 98, width: 205, height: 52 };

      expect(isSimilarPosition(pos1, pos2, 20)).toBe(true);
    });

    it('should detect different positions outside threshold', () => {
      const pos1 = { x: 100, y: 100, width: 200, height: 50 };
      const pos2 = { x: 150, y: 100, width: 200, height: 50 };

      expect(isSimilarPosition(pos1, pos2, 20)).toBe(false);
    });
  });

  describe('deduplicateComponents', () => {
    it('should merge similar components', () => {
      const existing: GeneratedComponent[] = [
        {
          id: '1',
          type: 'button',
          position: { x: 100, y: 100, width: 200, height: 50 },
          props: { variant: 'default' },
          sourceDrawingHash: 'hash1',
          timestamp: 1000,
        },
      ];

      const newComponents: GeminiComponentResponse[] = [
        {
          type: 'button',
          position: { x: 105, y: 102, width: 200, height: 50 },
          props: { variant: 'primary' },
        },
      ];

      const result = deduplicateComponents(existing, newComponents, 'hash2');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].props.variant).toBe('primary');
      expect(result[0].sourceDrawingHash).toBe('hash2');
    });

    it('should add new components that are not similar', () => {
      const existing: GeneratedComponent[] = [
        {
          id: '1',
          type: 'button',
          position: { x: 100, y: 100, width: 200, height: 50 },
          props: {},
          sourceDrawingHash: 'hash1',
          timestamp: 1000,
        },
      ];

      const newComponents: GeminiComponentResponse[] = [
        {
          type: 'input',
          position: { x: 300, y: 100, width: 200, height: 50 },
          props: {},
        },
      ];

      const result = deduplicateComponents(existing, newComponents, 'hash2');

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('button');
      expect(result[1].type).toBe('input');
    });
  });

  describe('mergeComponents', () => {
    it('should merge new components with existing', () => {
      const existing: GeneratedComponent[] = [
        {
          id: '1',
          type: 'button',
          position: { x: 100, y: 100, width: 200, height: 50 },
          props: {},
          sourceDrawingHash: 'hash1',
          timestamp: 1000,
        },
      ];

      const newComponents: GeminiComponentResponse[] = [
        {
          type: 'input',
          position: { x: 300, y: 100, width: 200, height: 50 },
          props: { placeholder: 'Enter text' },
        },
      ];

      const result = mergeComponents(existing, newComponents, 'hash2');

      expect(result).toHaveLength(2);
      expect(result.some(c => c.type === 'button')).toBe(true);
      expect(result.some(c => c.type === 'input')).toBe(true);
    });
  });
});

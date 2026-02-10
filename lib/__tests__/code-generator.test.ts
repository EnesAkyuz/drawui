import { describe, it, expect } from 'vitest';
import { generateReactCode, extractUsedComponents } from '../code-generator';
import type { GeneratedComponent } from '@/types/canvas';

describe('code-generator', () => {
  describe('extractUsedComponents', () => {
    it('should extract unique component types', () => {
      const components: GeneratedComponent[] = [
        {
          id: '1',
          type: 'button',
          props: {},
          position: { x: 0, y: 0, width: 100, height: 40 },
          sourceDrawingHash: 'hash',
          timestamp: 1000,
        },
        {
          id: '2',
          type: 'input',
          props: {},
          position: { x: 0, y: 50, width: 200, height: 40 },
          sourceDrawingHash: 'hash',
          timestamp: 1000,
        },
        {
          id: '3',
          type: 'button',
          props: {},
          position: { x: 0, y: 100, width: 100, height: 40 },
          sourceDrawingHash: 'hash',
          timestamp: 1000,
        },
      ];

      const result = extractUsedComponents(components);

      expect(result).toEqual(['button', 'input']);
    });
  });

  describe('generateReactCode', () => {
    it('should generate valid React component code', () => {
      const components: GeneratedComponent[] = [
        {
          id: '1',
          type: 'button',
          props: { variant: 'default', children: 'Click me' },
          position: { x: 100, y: 100, width: 120, height: 40 },
          sourceDrawingHash: 'hash',
          timestamp: 1000,
        },
      ];

      const code = generateReactCode(components);

      expect(code).toContain('import { Button }');
      expect(code).toContain('export default function GeneratedUI');
      expect(code).toContain('<Button');
      expect(code).toContain('variant="default"');
      expect(code).toContain('Click me');
      expect(code).toContain("position: 'absolute'");
      expect(code).toContain('left: 100');
      expect(code).toContain('top: 100');
    });

    it('should handle multiple components', () => {
      const components: GeneratedComponent[] = [
        {
          id: '1',
          type: 'button',
          props: { children: 'Button' },
          position: { x: 0, y: 0, width: 100, height: 40 },
          sourceDrawingHash: 'hash',
          timestamp: 1000,
        },
        {
          id: '2',
          type: 'input',
          props: { placeholder: 'Enter text' },
          position: { x: 0, y: 50, width: 200, height: 40 },
          sourceDrawingHash: 'hash',
          timestamp: 1000,
        },
      ];

      const code = generateReactCode(components);

      expect(code).toContain('import { Button, Input }');
      expect(code).toContain('<Button');
      expect(code).toContain('<Input');
    });

    it('should handle empty components array', () => {
      const code = generateReactCode([]);

      expect(code).toContain('export default function GeneratedUI');
      expect(code).toContain('No components generated yet');
    });
  });
});

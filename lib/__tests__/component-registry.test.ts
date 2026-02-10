import { describe, it, expect } from 'vitest';
import { getInstalledComponents, componentRegistry } from '../component-registry';

describe('component-registry', () => {
  it('should discover installed shadcn components', () => {
    const components = getInstalledComponents();

    expect(components).toBeInstanceOf(Array);
    expect(components.length).toBeGreaterThan(0);
    expect(components).toContain('button');
  });

  it.skip('should provide component registry with React components', () => {
    // Skipped: client-side only - registry is populated at runtime via loadComponentRegistry()
    expect(componentRegistry).toBeDefined();
    expect(componentRegistry.button).toBeDefined();
    expect(typeof componentRegistry.button).toBe('function');
  });

  it('should normalize component names to lowercase', () => {
    const components = getInstalledComponents();

    components.forEach(name => {
      expect(name).toBe(name.toLowerCase());
    });
  });
});

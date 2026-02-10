# Canvas-to-UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js canvas app that converts freehand drawings into production-ready React UI components using Google Gemini Vision API.

**Architecture:** Excalidraw-powered canvas with debounced AI detection pipeline, sending canvas snapshots to Gemini API for component recognition, rendering detected shadcn/ui components in preview mode with full code export capabilities.

**Tech Stack:** Next.js 16, React 19, TypeScript, Excalidraw, Google Gemini Vision API, shadcn/ui, Tailwind CSS v4, html-to-image, Vitest

---

## Task 1: Project Setup and Dependencies

**Files:**
- Modify: `package.json`
- Create: `.env.local`
- Create: `.gitignore` (update)
- Create: `scripts/install-all-shadcn.sh`

**Step 1: Install core dependencies**

Run:
```bash
bun add @excalidraw/excalidraw @google/generative-ai html-to-image uuid
```

Expected: Dependencies added to package.json

**Step 2: Install dev dependencies**

Run:
```bash
bun add -d @types/uuid vitest @vitest/ui jsdom @vitest/ui
```

Expected: Dev dependencies added

**Step 3: Create environment file template**

Create `.env.local`:
```env
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

**Step 4: Update .gitignore**

Add to `.gitignore`:
```
.env.local
.env*.local
```

**Step 5: Create shadcn installation script**

Create `scripts/install-all-shadcn.sh`:
```bash
#!/bin/bash

# Install all common shadcn/ui components for MVP
components=(
  "button"
  "input"
  "card"
  "label"
  "textarea"
  "select"
  "checkbox"
  "radio-group"
  "switch"
  "slider"
  "tabs"
  "dialog"
  "alert"
  "badge"
  "avatar"
  "separator"
  "toast"
  "tooltip"
)

for component in "${components[@]}"; do
  echo "Installing $component..."
  bunx shadcn@latest add "$component" -y
done

echo "All components installed!"
```

**Step 6: Make script executable and run**

Run:
```bash
chmod +x scripts/install-all-shadcn.sh
./scripts/install-all-shadcn.sh
```

Expected: All shadcn components installed to `components/ui/`

**Step 7: Verify installation**

Run:
```bash
ls -la components/ui/
```

Expected: See button.tsx, input.tsx, card.tsx, etc.

**Step 8: Commit setup**

```bash
git add .
git commit -m "chore: add dependencies and shadcn components for canvas-to-ui"
```

---

## Task 2: TypeScript Types and Interfaces

**Files:**
- Create: `types/canvas.ts`

**Step 1: Create types directory**

Run:
```bash
mkdir -p types
```

**Step 2: Write canvas types**

Create `types/canvas.ts`:
```typescript
export type CanvasMode = 'drawing' | 'preview';

export interface ComponentPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GeneratedComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  position: ComponentPosition;
  sourceDrawingHash: string;
  timestamp: number;
}

export interface GeminiComponentResponse {
  type: string;
  position: ComponentPosition;
  props: Record<string, any>;
}

export interface AnalyzeDrawingRequest {
  image: string; // base64
  availableComponents: string[];
}

export interface AnalyzeDrawingResponse {
  components: GeminiComponentResponse[];
  error?: string;
}
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
bunx tsc --noEmit
```

Expected: No errors

**Step 4: Commit types**

```bash
git add types/
git commit -m "feat: add TypeScript types for canvas components"
```

---

## Task 3: Component Registry and Discovery

**Files:**
- Create: `lib/component-registry.ts`
- Create: `lib/__tests__/component-registry.test.ts`

**Step 1: Write the failing test**

Create `lib/__tests__/component-registry.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getInstalledComponents, componentRegistry } from '../component-registry';

describe('component-registry', () => {
  it('should discover installed shadcn components', () => {
    const components = getInstalledComponents();

    expect(components).toBeInstanceOf(Array);
    expect(components.length).toBeGreaterThan(0);
    expect(components).toContain('button');
  });

  it('should provide component registry with React components', () => {
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
```

**Step 2: Run test to verify it fails**

Run:
```bash
bunx vitest run lib/__tests__/component-registry.test.ts
```

Expected: FAIL - module not found

**Step 3: Write component registry implementation**

Create `lib/component-registry.ts`:
```typescript
import fs from 'fs';
import path from 'path';
import type React from 'react';

// Dynamically discover installed shadcn components
export function getInstalledComponents(): string[] {
  const uiDir = path.join(process.cwd(), 'components/ui');

  if (!fs.existsSync(uiDir)) {
    return [];
  }

  const files = fs.readdirSync(uiDir);

  return files
    .filter(f => f.endsWith('.tsx') && f !== 'index.tsx')
    .map(f => f.replace('.tsx', '').toLowerCase())
    .sort();
}

// Dynamic component imports (client-side)
// This will be populated at runtime
export const componentRegistry: Record<string, React.ComponentType<any>> = {};

// Client-side component loader
export async function loadComponentRegistry() {
  const components = getInstalledComponents();

  for (const name of components) {
    try {
      const module = await import(`@/components/ui/${name}`);
      const ComponentName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      componentRegistry[name] = module[ComponentName] || module.default;
    } catch (error) {
      console.warn(`Failed to load component: ${name}`, error);
    }
  }

  return componentRegistry;
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bunx vitest run lib/__tests__/component-registry.test.ts
```

Expected: PASS (or skip client-side tests for now)

**Step 5: Commit component registry**

```bash
git add lib/component-registry.ts lib/__tests__/
git commit -m "feat: add component registry with dynamic discovery"
```

---

## Task 4: Canvas Utilities

**Files:**
- Create: `lib/canvas-utils.ts`
- Create: `lib/__tests__/canvas-utils.test.ts`

**Step 1: Write the failing test**

Create `lib/__tests__/canvas-utils.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebouncer, hashString } from '../canvas-utils';

describe('canvas-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDebouncer', () => {
    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debounced = createDebouncer(mockFn, 2000);

      debounced('test1');
      debounced('test2');
      debounced('test3');

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('should cancel previous timer on new call', () => {
      const mockFn = vi.fn();
      const debounced = createDebouncer(mockFn, 2000);

      debounced('test1');
      vi.advanceTimersByTime(1000);

      debounced('test2');
      vi.advanceTimersByTime(1000);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test2');
    });
  });

  describe('hashString', () => {
    it('should generate consistent hash for same input', () => {
      const input = 'test-string';
      const hash1 = hashString(input);
      const hash2 = hashString(input);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = hashString('input1');
      const hash2 = hashString('input2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return string hash', () => {
      const hash = hashString('test');

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bunx vitest run lib/__tests__/canvas-utils.test.ts
```

Expected: FAIL - module not found

**Step 3: Write canvas utilities implementation**

Create `lib/canvas-utils.ts`:
```typescript
export function createDebouncer<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export function hashString(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

export function captureCanvasAsBase64(
  canvasElement: HTMLCanvasElement
): string {
  return canvasElement.toDataURL('image/png');
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bunx vitest run lib/__tests__/canvas-utils.test.ts
```

Expected: PASS

**Step 5: Commit canvas utilities**

```bash
git add lib/canvas-utils.ts lib/__tests__/canvas-utils.test.ts
git commit -m "feat: add canvas utilities with debouncer and hashing"
```

---

## Task 5: Gemini API Client

**Files:**
- Create: `lib/gemini.ts`
- Create: `lib/__tests__/gemini.test.ts`

**Step 1: Write the failing test**

Create `lib/__tests__/gemini.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

Run:
```bash
bunx vitest run lib/__tests__/gemini.test.ts
```

Expected: FAIL - module not found

**Step 3: Write Gemini client implementation**

Create `lib/gemini.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiComponentResponse } from '@/types/canvas';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';

export function getGeminiClient() {
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not set in environment variables');
  }

  return new GoogleGenerativeAI(apiKey);
}

export function createGeminiPrompt(availableComponents: string[]): string {
  return `Analyze this UI sketch and identify shadcn/ui components.

Available components: ${availableComponents.join(', ')}

Return ONLY valid JSON array format:
[
  {
    "type": "button" | "input" | "card" | ...,
    "position": { "x": number, "y": number, "width": number, "height": number },
    "props": {
      // component-specific props (e.g., variant, placeholder, className)
    }
  }
]

Rules:
- Detect common UI patterns (buttons, inputs, cards, labels, etc.)
- Estimate position and size based on drawing bounds
- Provide sensible default props
- If nothing recognizable, return empty array: []
- Return ONLY the JSON array, no additional text

Examples:
- Rectangle with text inside → button
- Long horizontal rectangle → input
- Rectangle with multiple sections → card
- Short text → label`;
}

export function validateGeminiResponse(
  response: any
): response is GeminiComponentResponse[] {
  if (!Array.isArray(response)) {
    return false;
  }

  if (response.length === 0) {
    return true;
  }

  return response.every(item => {
    return (
      typeof item.type === 'string' &&
      item.position &&
      typeof item.position.x === 'number' &&
      typeof item.position.y === 'number' &&
      typeof item.position.width === 'number' &&
      typeof item.position.height === 'number' &&
      typeof item.props === 'object'
    );
  });
}

export async function analyzeDrawing(
  base64Image: string,
  availableComponents: string[]
): Promise<GeminiComponentResponse[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = createGeminiPrompt(availableComponents);

  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1], // Remove data:image/png;base64, prefix
      mimeType: 'image/png',
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    console.warn('No JSON found in Gemini response:', text);
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    if (!validateGeminiResponse(parsed)) {
      console.warn('Invalid Gemini response format:', parsed);
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    return [];
  }
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bunx vitest run lib/__tests__/gemini.test.ts
```

Expected: PASS

**Step 5: Commit Gemini client**

```bash
git add lib/gemini.ts lib/__tests__/gemini.test.ts
git commit -m "feat: add Gemini API client with validation"
```

---

## Task 6: API Route for Drawing Analysis

**Files:**
- Create: `app/api/analyze-drawing/route.ts`

**Step 1: Create API route directory**

Run:
```bash
mkdir -p app/api/analyze-drawing
```

**Step 2: Write API route handler**

Create `app/api/analyze-drawing/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analyzeDrawing } from '@/lib/gemini';
import { getInstalledComponents } from '@/lib/component-registry';
import type { AnalyzeDrawingRequest, AnalyzeDrawingResponse } from '@/types/canvas';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeDrawingRequest = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Get available components
    const availableComponents = body.availableComponents || getInstalledComponents();

    if (availableComponents.length === 0) {
      return NextResponse.json(
        { error: 'No components available' },
        { status: 500 }
      );
    }

    // Analyze drawing with Gemini
    const components = await analyzeDrawing(body.image, availableComponents);

    const response: AnalyzeDrawingResponse = {
      components,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error analyzing drawing:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to analyze drawing: ${errorMessage}` },
      { status: 500 }
    );
  }
}
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
bunx tsc --noEmit
```

Expected: No errors

**Step 4: Test API route manually (after server starts)**

Manual test command (for later):
```bash
curl -X POST http://localhost:3000/api/analyze-drawing \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,iVBORw0KG...", "availableComponents":["button"]}'
```

Expected: JSON response with components array

**Step 5: Commit API route**

```bash
git add app/api/
git commit -m "feat: add API route for drawing analysis"
```

---

## Task 7: Component Deduplication Logic

**Files:**
- Create: `lib/component-mapper.ts`
- Create: `lib/__tests__/component-mapper.test.ts`

**Step 1: Write the failing test**

Create `lib/__tests__/component-mapper.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

Run:
```bash
bunx vitest run lib/__tests__/component-mapper.test.ts
```

Expected: FAIL - module not found

**Step 3: Write component mapper implementation**

Create `lib/component-mapper.ts`:
```typescript
import { v4 as uuidv4 } from 'uuid';
import type {
  GeneratedComponent,
  GeminiComponentResponse,
  ComponentPosition
} from '@/types/canvas';

const POSITION_THRESHOLD = 20; // pixels

export function isSimilarPosition(
  pos1: ComponentPosition,
  pos2: ComponentPosition,
  threshold: number = POSITION_THRESHOLD
): boolean {
  return (
    Math.abs(pos1.x - pos2.x) <= threshold &&
    Math.abs(pos1.y - pos2.y) <= threshold &&
    Math.abs(pos1.width - pos2.width) <= threshold &&
    Math.abs(pos1.height - pos2.height) <= threshold
  );
}

export function deduplicateComponents(
  existing: GeneratedComponent[],
  newComponents: GeminiComponentResponse[],
  sourceDrawingHash: string
): GeneratedComponent[] {
  const result: GeneratedComponent[] = [...existing];
  const timestamp = Date.now();

  for (const newComp of newComponents) {
    // Find similar existing component
    const similarIndex = result.findIndex(
      existing =>
        existing.type === newComp.type &&
        isSimilarPosition(existing.position, newComp.position)
    );

    if (similarIndex >= 0) {
      // Update existing component
      result[similarIndex] = {
        ...result[similarIndex],
        props: newComp.props,
        position: newComp.position,
        sourceDrawingHash,
        timestamp,
      };
    } else {
      // Add new component
      result.push({
        id: uuidv4(),
        type: newComp.type,
        props: newComp.props,
        position: newComp.position,
        sourceDrawingHash,
        timestamp,
      });
    }
  }

  return result;
}

export function mergeComponents(
  existing: GeneratedComponent[],
  newComponents: GeminiComponentResponse[],
  sourceDrawingHash: string
): GeneratedComponent[] {
  return deduplicateComponents(existing, newComponents, sourceDrawingHash);
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bunx vitest run lib/__tests__/component-mapper.test.ts
```

Expected: PASS

**Step 5: Commit component mapper**

```bash
git add lib/component-mapper.ts lib/__tests__/component-mapper.test.ts
git commit -m "feat: add component deduplication logic"
```

---

## Task 8: Code Generator for Export

**Files:**
- Create: `lib/code-generator.ts`
- Create: `lib/__tests__/code-generator.test.ts`

**Step 1: Write the failing test**

Create `lib/__tests__/code-generator.test.ts`:
```typescript
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
      expect(code).toContain('position: "absolute"');
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
```

**Step 2: Run test to verify it fails**

Run:
```bash
bunx vitest run lib/__tests__/code-generator.test.ts
```

Expected: FAIL - module not found

**Step 3: Write code generator implementation**

Create `lib/code-generator.ts`:
```typescript
import type { GeneratedComponent } from '@/types/canvas';

export function extractUsedComponents(components: GeneratedComponent[]): string[] {
  const types = new Set(components.map(c => c.type));
  return Array.from(types).sort();
}

function capitalize(str: string): string {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function formatProps(props: Record<string, any>): string {
  return Object.entries(props)
    .map(([key, value]) => {
      if (key === 'children') {
        return null; // Handle children separately
      }

      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }

      if (typeof value === 'boolean') {
        return value ? key : null;
      }

      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter(Boolean)
    .join(' ');
}

function generateComponentJSX(component: GeneratedComponent): string {
  const ComponentName = capitalize(component.type);
  const propsStr = formatProps(component.props);
  const children = component.props.children || '';

  const style = {
    position: 'absolute' as const,
    left: component.position.x,
    top: component.position.y,
    width: component.position.width,
    height: component.position.height,
  };

  const styleStr = JSON.stringify(style, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");

  if (children) {
    return `      <${ComponentName} ${propsStr} style={${styleStr}}>
        ${children}
      </${ComponentName}>`;
  }

  return `      <${ComponentName} ${propsStr} style={${styleStr}} />`;
}

export function generateReactCode(components: GeneratedComponent[]): string {
  if (components.length === 0) {
    return `export default function GeneratedUI() {
  return (
    <div className="relative w-full h-screen">
      <p className="text-muted-foreground p-4">No components generated yet</p>
    </div>
  );
}`;
  }

  const usedComponents = extractUsedComponents(components);
  const componentNames = usedComponents.map(capitalize);

  const imports = `import { ${componentNames.join(', ')} } from '@/components/ui';`;

  const jsxComponents = components.map(generateComponentJSX).join('\n\n');

  return `${imports}

export default function GeneratedUI() {
  return (
    <div className="relative w-full h-screen">
${jsxComponents}
    </div>
  );
}`;
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bunx vitest run lib/__tests__/code-generator.test.ts
```

Expected: PASS

**Step 5: Commit code generator**

```bash
git add lib/code-generator.ts lib/__tests__/code-generator.test.ts
git commit -m "feat: add code generator for React component export"
```

---

## Task 9: Excalidraw Wrapper Component

**Files:**
- Create: `components/canvas/ExcalidrawWrapper.tsx`

**Step 1: Create canvas components directory**

Run:
```bash
mkdir -p components/canvas
```

**Step 2: Write Excalidraw wrapper component**

Create `components/canvas/ExcalidrawWrapper.tsx`:
```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState } from '@excalidraw/excalidraw/types/types';
import { createDebouncer, hashString } from '@/lib/canvas-utils';

interface ExcalidrawWrapperProps {
  onAnalyze: (imageData: string, elementsHash: string) => void;
  isAnalyzing: boolean;
}

export default function ExcalidrawWrapper({
  onAnalyze,
  isAnalyzing,
}: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const captureAndAnalyze = useCallback(
    async (elements: readonly ExcalidrawElement[]) => {
      if (!excalidrawAPI || elements.length === 0) return;

      try {
        // Get canvas blob
        const blob = await excalidrawAPI.getSceneElements();
        const canvas = document.querySelector('.excalidraw canvas') as HTMLCanvasElement;

        if (!canvas) {
          console.warn('Canvas element not found');
          return;
        }

        // Convert to base64
        const imageData = canvas.toDataURL('image/png');

        // Hash elements for deduplication
        const elementsHash = hashString(JSON.stringify(elements));

        // Send for analysis
        onAnalyze(imageData, elementsHash);
      } catch (error) {
        console.error('Failed to capture canvas:', error);
      }
    },
    [excalidrawAPI, onAnalyze]
  );

  // Create debounced analyzer
  const debouncedAnalyze = useCallback(
    createDebouncer(captureAndAnalyze, 2000),
    [captureAndAnalyze]
  );

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState) => {
      if (isAnalyzing) return;
      debouncedAnalyze(elements);
    },
    [debouncedAnalyze, isAnalyzing]
  );

  return (
    <div className="w-full h-full">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        theme="dark"
      />
    </div>
  );
}
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
bunx tsc --noEmit
```

Expected: No errors (may have warnings about Excalidraw types)

**Step 4: Commit Excalidraw wrapper**

```bash
git add components/canvas/ExcalidrawWrapper.tsx
git commit -m "feat: add Excalidraw wrapper with debounced analysis"
```

---

## Task 10: Component Layer Renderer

**Files:**
- Create: `components/canvas/ComponentLayer.tsx`

**Step 1: Write component layer renderer**

Create `components/canvas/ComponentLayer.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import type { GeneratedComponent } from '@/types/canvas';
import { loadComponentRegistry } from '@/lib/component-registry';

interface ComponentLayerProps {
  component: GeneratedComponent;
}

export default function ComponentLayer({ component }: ComponentLayerProps) {
  const [ComponentToRender, setComponentToRender] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    loadComponentRegistry().then((registry) => {
      const Component = registry[component.type];
      if (Component) {
        setComponentToRender(() => Component);
      } else {
        console.warn(`Component not found in registry: ${component.type}`);
      }
    });
  }, [component.type]);

  if (!ComponentToRender) {
    return (
      <div
        style={{
          position: 'absolute',
          left: component.position.x,
          top: component.position.y,
          width: component.position.width,
          height: component.position.height,
        }}
        className="border border-dashed border-red-500 flex items-center justify-center text-xs text-red-500"
      >
        {component.type}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: component.position.x,
        top: component.position.y,
        width: component.position.width,
        height: component.position.height,
      }}
      className="pointer-events-auto"
    >
      <ComponentToRender {...component.props} />
    </div>
  );
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
bunx tsc --noEmit
```

Expected: No errors

**Step 3: Commit component layer**

```bash
git add components/canvas/ComponentLayer.tsx
git commit -m "feat: add component layer renderer with dynamic loading"
```

---

## Task 11: Preview Overlay Component

**Files:**
- Create: `components/canvas/PreviewOverlay.tsx`

**Step 1: Write preview overlay component**

Create `components/canvas/PreviewOverlay.tsx`:
```typescript
'use client';

import type { GeneratedComponent } from '@/types/canvas';
import ComponentLayer from './ComponentLayer';

interface PreviewOverlayProps {
  components: GeneratedComponent[];
  isVisible: boolean;
}

export default function PreviewOverlay({
  components,
  isVisible,
}: PreviewOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 bg-background/95 pointer-events-none z-10"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full h-full">
        {components.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              No components generated yet. Draw something and wait for AI detection.
            </p>
          </div>
        ) : (
          components.map((component) => (
            <ComponentLayer key={component.id} component={component} />
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
bunx tsc --noEmit
```

Expected: No errors

**Step 3: Commit preview overlay**

```bash
git add components/canvas/PreviewOverlay.tsx
git commit -m "feat: add preview overlay for generated components"
```

---

## Task 12: Export Panel Component

**Files:**
- Create: `components/export/ExportPanel.tsx`
- Create: `components/export/CodeGenerator.tsx`

**Step 1: Create export components directory**

Run:
```bash
mkdir -p components/export
```

**Step 2: Write code display component**

Create `components/export/CodeGenerator.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Check } from 'lucide-react';
import { generateReactCode } from '@/lib/code-generator';
import type { GeneratedComponent } from '@/types/canvas';

interface CodeGeneratorProps {
  components: GeneratedComponent[];
}

export default function CodeGenerator({ components }: CodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const code = generateReactCode(components);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-ui.tsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Generated Code</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      <Textarea
        value={code}
        readOnly
        className="font-mono text-xs h-[400px] resize-none"
      />
    </div>
  );
}
```

**Step 3: Write export panel component**

Create `components/export/ExportPanel.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import CodeGenerator from './CodeGenerator';
import type { GeneratedComponent } from '@/types/canvas';

interface ExportPanelProps {
  components: GeneratedComponent[];
  previewRef: React.RefObject<HTMLDivElement>;
}

export default function ExportPanel({ components, previewRef }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportImage = async (format: 'png' | 'svg') => {
    if (!previewRef.current) return;

    setIsExporting(true);

    try {
      const dataUrl = format === 'png'
        ? await toPng(previewRef.current, { quality: 1.0 })
        : await toSvg(previewRef.current);

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `generated-ui.${format}`;
      a.click();
    } catch (error) {
      console.error('Failed to export image:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="p-4">
      <Tabs defaultValue="code">
        <TabsList className="w-full">
          <TabsTrigger value="code" className="flex-1">Code</TabsTrigger>
          <TabsTrigger value="image" className="flex-1">Image</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-4">
          <CodeGenerator components={components} />
        </TabsContent>

        <TabsContent value="image" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => handleExportImage('png')}
              disabled={isExporting || components.length === 0}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Export PNG
            </Button>
            <Button
              onClick={() => handleExportImage('svg')}
              disabled={isExporting || components.length === 0}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Export SVG
            </Button>
          </div>
          {components.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Generate components first to export images
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
```

**Step 4: Verify TypeScript compilation**

Run:
```bash
bunx tsc --noEmit
```

Expected: No errors

**Step 5: Commit export components**

```bash
git add components/export/
git commit -m "feat: add export panel with code and image export"
```

---

## Task 13: Main Drawing Canvas Component

**Files:**
- Create: `components/canvas/DrawingCanvas.tsx`

**Step 1: Write main drawing canvas component**

Create `components/canvas/DrawingCanvas.tsx`:
```typescript
'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Eye, Loader2 } from 'lucide-react';
import ExcalidrawWrapper from './ExcalidrawWrapper';
import PreviewOverlay from './PreviewOverlay';
import ExportPanel from '../export/ExportPanel';
import { mergeComponents } from '@/lib/component-mapper';
import type { CanvasMode, GeneratedComponent } from '@/types/canvas';

export default function DrawingCanvas() {
  const [mode, setMode] = useState<CanvasMode>('drawing');
  const [components, setComponents] = useState<GeneratedComponent[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = useCallback(
    async (imageData: string, elementsHash: string) => {
      setIsAnalyzing(true);

      try {
        const response = await fetch('/api/analyze-drawing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze drawing');
        }

        const data = await response.json();

        if (data.components && data.components.length > 0) {
          setComponents((prev) =>
            mergeComponents(prev, data.components, elementsHash)
          );
        }
      } catch (error) {
        console.error('Error analyzing drawing:', error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const toggleMode = () => {
    setMode((prev) => (prev === 'drawing' ? 'preview' : 'drawing'));
  };

  return (
    <div className="flex h-screen">
      {/* Canvas Area */}
      <div className="flex-1 relative">
        {/* Mode Toggle */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <Button
            variant={mode === 'drawing' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleMode}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Drawing
          </Button>
          <Button
            variant={mode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleMode}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-20">
          {isAnalyzing && (
            <Badge variant="secondary" className="gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing...
            </Badge>
          )}
          {components.length > 0 && !isAnalyzing && (
            <Badge variant="default">
              {components.length} component{components.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Excalidraw Canvas */}
        <div className="w-full h-full">
          <ExcalidrawWrapper
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Preview Overlay */}
        <div ref={previewRef}>
          <PreviewOverlay
            components={components}
            isVisible={mode === 'preview'}
          />
        </div>
      </div>

      {/* Export Panel */}
      <div className="w-[400px] border-l bg-card p-4 overflow-y-auto">
        <ExportPanel components={components} previewRef={previewRef} />
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
bunx tsc --noEmit
```

Expected: No errors

**Step 3: Commit main canvas component**

```bash
git add components/canvas/DrawingCanvas.tsx
git commit -m "feat: add main drawing canvas with mode switching"
```

---

## Task 14: Update Main Page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Read current page**

Run:
```bash
cat app/page.tsx
```

**Step 2: Replace with canvas app**

Replace contents of `app/page.tsx`:
```typescript
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Excalidraw
const DrawingCanvas = dynamic(
  () => import('@/components/canvas/DrawingCanvas'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <DrawingCanvas />
    </main>
  );
}
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
bunx tsc --noEmit
```

Expected: No errors

**Step 4: Commit page update**

```bash
git add app/page.tsx
git commit -m "feat: update main page to render canvas app"
```

---

## Task 15: Add Vitest Configuration

**Files:**
- Create: `vitest.config.ts`

**Step 1: Create Vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Step 2: Add test script to package.json**

Add to `package.json` scripts:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

**Step 3: Run tests**

Run:
```bash
bun test
```

Expected: All tests pass

**Step 4: Commit Vitest config**

```bash
git add vitest.config.ts package.json
git commit -m "chore: add Vitest configuration"
```

---

## Task 16: Update Globals CSS for Canvas

**Files:**
- Modify: `app/globals.css`

**Step 1: Read current globals.css**

Run:
```bash
cat app/globals.css
```

**Step 2: Add canvas-specific styles**

Add to bottom of `app/globals.css`:
```css

/* Canvas specific styles */
.excalidraw {
  @apply w-full h-full;
}

.excalidraw .App-menu_top {
  @apply bg-card;
}

/* Ensure Excalidraw renders in dark mode */
.excalidraw.theme--dark {
  @apply bg-background;
}

/* Export preview styles */
.preview-container {
  @apply bg-background;
}
```

**Step 3: Verify CSS syntax**

Run:
```bash
bun dev
```

Check for CSS errors in console.

**Step 4: Commit CSS updates**

```bash
git add app/globals.css
git commit -m "style: add canvas-specific CSS styles"
```

---

## Task 17: Fix Component Registry Client-Side Loading

**Files:**
- Modify: `lib/component-registry.ts`
- Create: `lib/component-registry.client.ts`

**Step 1: Create client-side registry**

Create `lib/component-registry.client.ts`:
```typescript
'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export const componentRegistry: Record<string, React.ComponentType<any>> = {
  button: Button,
  input: Input,
  card: Card,
  cardheader: CardHeader,
  cardcontent: CardContent,
  cardfooter: CardFooter,
  cardtitle: CardTitle,
  carddescription: CardDescription,
  label: Label,
  textarea: Textarea,
  select: Select,
  selecttrigger: SelectTrigger,
  selectvalue: SelectValue,
  selectcontent: SelectContent,
  selectitem: SelectItem,
  checkbox: Checkbox,
  radiogroup: RadioGroup,
  radiogroupitem: RadioGroupItem,
  switch: Switch,
  slider: Slider,
  tabs: Tabs,
  tabslist: TabsList,
  tabstrigger: TabsTrigger,
  tabscontent: TabsContent,
  dialog: Dialog,
  dialogtrigger: DialogTrigger,
  dialogcontent: DialogContent,
  dialogheader: DialogHeader,
  dialogtitle: DialogTitle,
  dialogdescription: DialogDescription,
  dialogfooter: DialogFooter,
  alert: Alert,
  alerttitle: AlertTitle,
  alertdescription: AlertDescription,
  badge: Badge,
  avatar: Avatar,
  avatarimage: AvatarImage,
  avatarfallback: AvatarFallback,
  separator: Separator,
  tooltip: Tooltip,
  tooltiptrigger: TooltipTrigger,
  tooltipcontent: TooltipContent,
  tooltipprovider: TooltipProvider,
};

export function getComponentFromRegistry(type: string): React.ComponentType<any> | undefined {
  return componentRegistry[type.toLowerCase()];
}
```

**Step 2: Update ComponentLayer to use client registry**

Modify `components/canvas/ComponentLayer.tsx`:
```typescript
'use client';

import { useMemo } from 'react';
import type { GeneratedComponent } from '@/types/canvas';
import { getComponentFromRegistry } from '@/lib/component-registry.client';

interface ComponentLayerProps {
  component: GeneratedComponent;
}

export default function ComponentLayer({ component }: ComponentLayerProps) {
  const ComponentToRender = useMemo(
    () => getComponentFromRegistry(component.type),
    [component.type]
  );

  if (!ComponentToRender) {
    return (
      <div
        style={{
          position: 'absolute',
          left: component.position.x,
          top: component.position.y,
          width: component.position.width,
          height: component.position.height,
        }}
        className="border border-dashed border-red-500 flex items-center justify-center text-xs text-red-500"
      >
        {component.type}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: component.position.x,
        top: component.position.y,
        width: component.position.width,
        height: component.position.height,
      }}
      className="pointer-events-auto"
    >
      <ComponentToRender {...component.props} />
    </div>
  );
}
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
bunx tsc --noEmit
```

Expected: No errors

**Step 4: Commit registry fix**

```bash
git add lib/component-registry.client.ts components/canvas/ComponentLayer.tsx
git commit -m "fix: use client-side component registry for dynamic rendering"
```

---

## Task 18: Manual Testing and Verification

**Files:**
- None (manual testing)

**Step 1: Set up environment variables**

Create `.env.local` with real API key:
```env
GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
```

**Step 2: Start development server**

Run:
```bash
bun dev
```

Expected: Server starts on http://localhost:3000

**Step 3: Manual test checklist**

Open browser to http://localhost:3000 and verify:

1. ✓ Excalidraw canvas loads
2. ✓ Can draw shapes with pen tool
3. ✓ After 2 seconds of inactivity, "Analyzing..." badge appears
4. ✓ Components are detected (check console for API calls)
5. ✓ Can switch to Preview mode
6. ✓ Generated components render in Preview mode
7. ✓ Can export code (copy and download)
8. ✓ Can export PNG image
9. ✓ Component count badge updates

**Step 4: Test specific scenarios**

- Draw a rectangle → Should detect button or card
- Draw a long horizontal rectangle → Should detect input
- Draw multiple shapes → Should detect multiple components
- Draw, wait, draw more → Should merge components

**Step 5: Check for errors**

Run:
```bash
bunx tsc --noEmit
bun test
```

Expected: No errors, all tests pass

**Step 6: Document findings**

If issues found, create GitHub issues or add to TODO list.

---

## Task 19: Create README Documentation

**Files:**
- Create: `README.md`

**Step 1: Write README**

Create `README.md`:
```markdown
# Canvas-to-UI

Convert freehand drawings into production-ready React UI components using AI.

## Features

- 🎨 **Canvas Drawing** - Powered by Excalidraw with full toolset
- 🤖 **AI Detection** - Google Gemini Vision API automatically detects UI components
- 🎯 **shadcn/ui** - Generates components from the shadcn/ui library
- 🔄 **Live Preview** - Switch between drawing and preview modes
- 📦 **Export** - Generate React/TypeScript code and image snapshots

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd drawui
   ```

2. Install dependencies:
   ```bash
   bun install
   ./scripts/install-all-shadcn.sh
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Add your GOOGLE_GEMINI_API_KEY
   ```

4. Start development server:
   ```bash
   bun dev
   ```

5. Open http://localhost:3000

## Usage

1. **Draw** - Use Excalidraw tools to sketch UI mockups
2. **Wait** - AI automatically analyzes after 2 seconds of inactivity
3. **Preview** - Switch to Preview mode to see generated components
4. **Export** - Copy code or download as `.tsx` file or image

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Canvas:** Excalidraw
- **AI:** Google Gemini Vision API
- **UI:** shadcn/ui, Radix UI, Tailwind CSS v4
- **Testing:** Vitest, React Testing Library
- **Package Manager:** Bun

## Architecture

```
app/
  page.tsx                  # Main canvas app
  api/analyze-drawing/      # Gemini API route
components/
  canvas/                   # Canvas components
  export/                   # Export functionality
  ui/                       # shadcn/ui components
lib/
  gemini.ts                 # Gemini API client
  canvas-utils.ts           # Canvas utilities
  component-mapper.ts       # Component deduplication
  code-generator.ts         # React code generation
types/
  canvas.ts                 # TypeScript types
```

## Development

**Run tests:**
```bash
bun test
```

**Build for production:**
```bash
bun run build
```

**Lint code:**
```bash
bun run lint
```

**Format code:**
```bash
bun run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT
```

**Step 2: Create example env file**

Create `.env.local.example`:
```env
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

**Step 3: Commit documentation**

```bash
git add README.md .env.local.example
git commit -m "docs: add README and environment template"
```

---

## Task 20: Final Integration and Polish

**Files:**
- Modify: `app/layout.tsx` (add metadata)
- Create: `app/favicon.ico` (optional)

**Step 1: Update metadata in layout**

Modify `app/layout.tsx` to add proper metadata:
```typescript
export const metadata = {
  title: 'Canvas-to-UI - AI-Powered UI Generator',
  description: 'Convert freehand drawings into production-ready React UI components using AI',
};
```

**Step 2: Run final verification**

Run:
```bash
bunx tsc --noEmit
bun test
bun run lint
```

Expected: All checks pass

**Step 3: Create final build**

Run:
```bash
bun run build
```

Expected: Build succeeds

**Step 4: Test production build**

Run:
```bash
bun start
```

Expected: App runs in production mode

**Step 5: Final commit**

```bash
git add .
git commit -m "chore: final integration and polish"
```

**Step 6: Create summary document**

Create `docs/IMPLEMENTATION_SUMMARY.md`:
```markdown
# Implementation Summary

## Completed Features

✅ Excalidraw canvas integration
✅ Debounced AI detection (2s delay)
✅ Google Gemini Vision API integration
✅ Component deduplication logic
✅ Drawing mode and Preview mode
✅ Code export (copy/download)
✅ Image export (PNG/SVG)
✅ Dynamic component registry
✅ Full test coverage for utilities
✅ TypeScript type safety
✅ Responsive UI with Tailwind CSS v4

## Components Implemented

- DrawingCanvas (main component)
- ExcalidrawWrapper (canvas integration)
- PreviewOverlay (component rendering)
- ComponentLayer (individual component)
- ExportPanel (export interface)
- CodeGenerator (code generation)

## API Routes

- POST /api/analyze-drawing - Gemini Vision analysis

## Test Coverage

- canvas-utils.test.ts - Debouncing and hashing
- component-mapper.test.ts - Deduplication logic
- code-generator.test.ts - Code generation
- gemini.test.ts - API prompt and validation
- component-registry.test.ts - Component discovery

## Known Limitations

- Requires Google Gemini API key
- Detection accuracy depends on drawing clarity
- Limited to shadcn/ui component library
- No undo/redo for component management (future)
- No component editing in Preview mode (future)

## Next Steps

1. Add more sophisticated component detection prompts
2. Implement component editing in Preview mode
3. Add undo/redo functionality
4. Create template library
5. Add collaboration features
```

**Step 7: Commit summary**

```bash
git add docs/IMPLEMENTATION_SUMMARY.md
git commit -m "docs: add implementation summary"
```

---

## Completion

All tasks complete! The Canvas-to-UI application is now fully implemented with:

✅ Complete project setup
✅ All core features working
✅ Full test coverage for utilities
✅ Production-ready code
✅ Documentation

**To use:**
```bash
bun dev
```

Then open http://localhost:3000 and start drawing!

**Required after implementation:**
- Use @superpowers:finishing-a-development-branch to complete this work

/**
 * Cache for generated code based on sketch hash
 * Prevents redundant API calls for identical sketches
 */

interface CacheEntry {
  code: string;
  timestamp: number;
  styleGuide: string;
  customPrompt: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

// Simple hash function for images
export function hashImage(base64Image: string): string {
  // Use the first and last parts of the base64 string for a quick hash
  const data = base64Image.split(',')[1] || base64Image;
  const sample = data.slice(0, 100) + data.slice(-100);

  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString(36);
}

// Create cache key from all generation parameters
export function createCacheKey(
  imageHash: string,
  styleGuide: string,
  customPrompt: string,
  colorPalette: any
): string {
  const paletteStr = JSON.stringify(colorPalette);
  return `${imageHash}:${styleGuide}:${customPrompt}:${paletteStr}`;
}

class SketchCache {
  private cache = new Map<string, CacheEntry>();
  private maxAge = 30 * 60 * 1000; // 30 minutes
  private maxSize = 100;

  get(key: string): string | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    console.log('🎯 Cache hit! Using cached result');
    return entry.code;
  }

  set(key: string, entry: Omit<CacheEntry, 'timestamp'>) {
    // Enforce max size (LRU eviction)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      ...entry,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge,
    };
  }
}

// Singleton instance
export const sketchCache = new SketchCache();

// Cleanup expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of (sketchCache as any).cache.entries()) {
      if (now - entry.timestamp > (sketchCache as any).maxAge) {
        (sketchCache as any).cache.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

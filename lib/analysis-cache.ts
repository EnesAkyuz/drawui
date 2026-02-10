/**
 * Cache layer for AI analysis results
 * Reduces redundant API calls for similar drawings
 */

import type { GeminiComponentResponse } from "@/types/canvas";

interface CacheEntry {
  components: GeminiComponentResponse[];
  timestamp: number;
  imageHash: string;
}

class AnalysisCache {
  private cache = new Map<string, CacheEntry>();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  private maxSize = 50; // Max cache entries

  /**
   * Get cached result if available and fresh
   */
  get(key: string): GeminiComponentResponse[] | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    console.log("✨ Cache hit! Using cached analysis");
    return entry.components;
  }

  /**
   * Store analysis result in cache
   */
  set(key: string, components: GeminiComponentResponse[], imageHash: string) {
    // Enforce max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      components,
      timestamp: Date.now(),
      imageHash,
    });
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const analysisCache = new AnalysisCache();

// Cleanup expired entries every minute
if (typeof window !== "undefined") {
  setInterval(() => analysisCache.cleanup(), 60000);
}

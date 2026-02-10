import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncer, hashString } from "../canvas-utils";

describe("canvas-utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createDebouncer", () => {
    it("should debounce function calls", () => {
      const mockFn = vi.fn();
      const debounced = createDebouncer(mockFn, 2000);

      debounced("test1");
      debounced("test2");
      debounced("test3");

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("test3");
    });

    it("should cancel previous timer on new call", () => {
      const mockFn = vi.fn();
      const debounced = createDebouncer(mockFn, 2000);

      debounced("test1");
      vi.advanceTimersByTime(1000);

      debounced("test2");
      vi.advanceTimersByTime(1000);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("test2");
    });
  });

  describe("hashString", () => {
    it("should generate consistent hash for same input", () => {
      const input = "test-string";
      const hash1 = hashString(input);
      const hash2 = hashString(input);

      expect(hash1).toBe(hash2);
    });

    it("should generate different hashes for different inputs", () => {
      const hash1 = hashString("input1");
      const hash2 = hashString("input2");

      expect(hash1).not.toBe(hash2);
    });

    it("should return string hash", () => {
      const hash = hashString("test");

      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });
  });
});

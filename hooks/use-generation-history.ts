import { useState, useCallback, useEffect } from 'react';
import type { GenerationHistoryEntry } from '@/types/history';

const STORAGE_KEY = 'drawui_generation_history';
const MAX_ENTRIES = 20;

export function useGenerationHistory() {
  const [entries, setEntries] = useState<GenerationHistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setEntries(parsed);
        setCurrentIndex(parsed.length - 1);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (entries.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch (error) {
        console.error('Failed to save history:', error);
      }
    }
  }, [entries]);

  const addEntry = useCallback((entry: Omit<GenerationHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: GenerationHistoryEntry = {
      ...entry,
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setEntries(prev => {
      const newEntries = [...prev, newEntry];
      // Keep only the last MAX_ENTRIES
      if (newEntries.length > MAX_ENTRIES) {
        return newEntries.slice(-MAX_ENTRIES);
      }
      return newEntries;
    });

    setCurrentIndex(prev => {
      const newLength = Math.min(entries.length + 1, MAX_ENTRIES);
      return newLength - 1;
    });

    return newEntry.id;
  }, [entries.length]);

  const goToEntry = useCallback((index: number) => {
    if (index >= 0 && index < entries.length) {
      setCurrentIndex(index);
      return entries[index];
    }
    return null;
  }, [entries]);

  const goToEntryById = useCallback((id: string) => {
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
      setCurrentIndex(index);
      return entries[index];
    }
    return null;
  }, [entries]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.id !== id);
      // Adjust current index if needed
      const deletedIndex = prev.findIndex(e => e.id === id);
      if (deletedIndex !== -1 && deletedIndex <= currentIndex) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
      return filtered;
    });
  }, [currentIndex]);

  const clearHistory = useCallback(() => {
    setEntries([]);
    setCurrentIndex(-1);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < entries.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      return entries[newIndex];
    }
    return null;
  }, [canUndo, currentIndex, entries]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      return entries[newIndex];
    }
    return null;
  }, [canRedo, currentIndex, entries]);

  return {
    entries,
    currentEntry: currentIndex >= 0 ? entries[currentIndex] : null,
    currentIndex,
    addEntry,
    goToEntry,
    goToEntryById,
    deleteEntry,
    clearHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

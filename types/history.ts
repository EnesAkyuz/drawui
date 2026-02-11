export interface GenerationHistoryEntry {
  id: string;
  code: string;
  thumbnail: string; // base64 image of the sketch
  timestamp: number;
  styleGuide: string;
  customPrompt?: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  generationTime: number; // in seconds
}

export interface HistoryState {
  entries: GenerationHistoryEntry[];
  currentIndex: number;
  maxEntries: number;
}

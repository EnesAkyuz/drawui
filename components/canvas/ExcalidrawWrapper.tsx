'use client';

import { useState, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
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
    async (elements: readonly any[]) => {
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
    (elements: readonly any[], appState: any) => {
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

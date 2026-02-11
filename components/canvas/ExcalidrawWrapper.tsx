"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "@/app/excalidraw-custom.css";
import { useCallback, useRef, useEffect } from "react";
import { hashString } from "@/lib/canvas-utils";

interface ExcalidrawWrapperProps {
  onCapture: (imageData: string, elementsHash: string) => void;
}

export default function ExcalidrawWrapper({
  onCapture,
}: ExcalidrawWrapperProps) {
  const excalidrawAPIRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const captureAndAnalyze = useCallback(
    async (elements: readonly any[]) => {
      if (elements.length === 0) {
        console.log("Skipping: no elements");
        return;
      }

      const api = excalidrawAPIRef.current;
      if (!api) {
        console.log("❌ No Excalidraw API available");
        return;
      }

      try {
        console.log("🚀 Starting analysis with", elements.length, "elements");
        const analysisStart = performance.now();

        // Get canvas
        const canvas = document.querySelector(
          ".excalidraw canvas",
        ) as HTMLCanvasElement;

        if (!canvas) {
          console.warn("Canvas element not found");
          return;
        }

        // Optimize image
        const maxSize = 800;
        const scale = Math.min(
          maxSize / canvas.width,
          maxSize / canvas.height,
          1,
        );

        const optimizedCanvas = document.createElement("canvas");
        optimizedCanvas.width = canvas.width * scale;
        optimizedCanvas.height = canvas.height * scale;

        const ctx = optimizedCanvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(
            canvas,
            0,
            0,
            optimizedCanvas.width,
            optimizedCanvas.height,
          );
        }

        const imageData = optimizedCanvas.toDataURL("image/jpeg", 0.85);
        const elementsHash = hashString(JSON.stringify(elements));

        const captureTime = performance.now() - analysisStart;
        console.log(`📸 Captured in ${captureTime.toFixed(0)}ms`);

        // Send to parent
        onCapture(imageData, elementsHash);
      } catch (error) {
        console.error("Failed to capture canvas:", error);
      }
    },
    [onCapture],
  );

  const handleChange = useCallback(
    (elements: readonly any[], _appState: any) => {
      if (elements.length === 0) {
        return;
      }

      if (!excalidrawAPIRef.current) {
        return;
      }

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer (2 second debounce to capture the latest state)
      debounceTimerRef.current = setTimeout(() => {
        captureAndAnalyze(elements);
      }, 2000);
    },
    [captureAndAnalyze],
  );

  const handleExcalidrawAPI = useCallback((api: any) => {
    console.log("✅ Excalidraw API initialized");
    excalidrawAPIRef.current = api;
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-full">
      <Excalidraw
        excalidrawAPI={handleExcalidrawAPI}
        onChange={handleChange}
        theme="dark"
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveAsImage: false,
            export: false,
            saveToActiveFile: false,
            toggleTheme: false,
          },
        }}
        initialData={{
          libraryItems: [],
        }}
      />
    </div>
  );
}

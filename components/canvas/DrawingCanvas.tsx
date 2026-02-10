"use client";

import { Eye, Loader2, Pencil } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mergeComponents } from "@/lib/component-mapper";
import type { CanvasMode, GeneratedComponent } from "@/types/canvas";
import ExportPanel from "../export/ExportPanel";
import ExcalidrawWrapper from "./ExcalidrawWrapper";
import PreviewOverlay from "./PreviewOverlay";

export default function DrawingCanvas() {
  const [mode, setMode] = useState<CanvasMode>("drawing");
  const [components, setComponents] = useState<GeneratedComponent[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = useCallback(
    async (imageData: string, elementsHash: string) => {
      setIsAnalyzing(true);

      try {
        const response = await fetch("/api/analyze-drawing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageData }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze drawing");
        }

        const data = await response.json();

        if (data.components && data.components.length > 0) {
          setComponents((prev) =>
            mergeComponents(prev, data.components, elementsHash),
          );
        }
      } catch (error) {
        console.error("Error analyzing drawing:", error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const toggleMode = () => {
    setMode((prev) => (prev === "drawing" ? "preview" : "drawing"));
  };

  return (
    <div className="flex h-screen">
      {/* Canvas Area */}
      <div className="flex-1 relative">
        {/* Mode Toggle */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <Button
            variant={mode === "drawing" ? "default" : "outline"}
            size="sm"
            onClick={toggleMode}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Drawing
          </Button>
          <Button
            variant={mode === "preview" ? "default" : "outline"}
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
              {components.length} component{components.length !== 1 ? "s" : ""}
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
            isVisible={mode === "preview"}
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

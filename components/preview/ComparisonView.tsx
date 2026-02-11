"use client";

import { useState, useRef, useEffect, memo } from "react";
import { GripVertical } from "lucide-react";
import SimplePreview from "../canvas/SimplePreview";

interface ComparisonViewProps {
  code: string;
  sketchImage: string;
}

export const ComparisonView = memo(function ComparisonView({ code, sketchImage }: ComparisonViewProps) {
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSplitPosition(Math.min(Math.max(percentage, 10), 90));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="h-full relative flex bg-muted/30"
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* Left Panel - Sketch */}
      <div
        className="overflow-hidden bg-background flex items-center justify-center p-4"
        style={{ width: `${splitPosition}%` }}
      >
        <div className="max-w-full max-h-full">
          <div className="text-xs font-medium text-muted-foreground mb-2 text-center">
            Original Sketch
          </div>
          <img
            src={sketchImage}
            alt="Original sketch"
            className="max-w-full max-h-[calc(100%-2rem)] object-contain border rounded-lg"
          />
        </div>
      </div>

      {/* Divider */}
      <div
        className={`relative w-1 bg-border hover:bg-primary transition-colors cursor-col-resize flex items-center justify-center ${
          isDragging ? "bg-primary" : ""
        }`}
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <div className="absolute top-1/2 -translate-y-1/2 bg-background border rounded-full p-1 shadow-lg">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Right Panel - Generated */}
      <div
        className="overflow-hidden bg-background"
        style={{ width: `${100 - splitPosition}%` }}
      >
        <div className="h-full flex flex-col">
          <div className="text-xs font-medium text-muted-foreground p-2 text-center border-b">
            Generated Website
          </div>
          <div className="flex-1 overflow-auto">
            <SimplePreview code={code} />
          </div>
        </div>
      </div>
    </div>
  );
});

"use client";

import type { GeneratedComponent } from "@/types/canvas";
import ComponentLayer from "./ComponentLayer";

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
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full h-full">
        {components.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              No components generated yet. Draw something and wait for AI
              detection.
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

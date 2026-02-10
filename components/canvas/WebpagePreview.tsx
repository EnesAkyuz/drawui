"use client";

import { useMemo } from "react";
import { getComponentFromRegistry } from "@/lib/component-registry.client";
import type { GeneratedComponent } from "@/types/canvas";

interface WebpagePreviewProps {
  components: GeneratedComponent[];
  isVisible: boolean;
}

function ComponentRenderer({ component }: { component: GeneratedComponent }) {
  const Component = useMemo(
    () => getComponentFromRegistry(component.type),
    [component.type],
  );

  if (!Component) {
    return (
      <div className="border border-dashed border-red-500 p-2 rounded text-xs text-red-500">
        Unknown: {component.type}
      </div>
    );
  }

  return <Component {...component.props} />;
}

export default function WebpagePreview({ components, isVisible }: WebpagePreviewProps) {
  if (!isVisible) return null;

  if (components.length === 0) {
    return (
      <div className="absolute inset-0 bg-background/95 pointer-events-none z-10 flex items-center justify-center" style={{ backdropFilter: "blur(4px)" }}>
        <p className="text-muted-foreground text-center px-4">
          No components generated yet.<br />
          Draw something and wait for AI detection.
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 bg-background overflow-auto z-10"
      style={{ backdropFilter: "blur(2px)" }}
    >
      {/* Free-form canvas - Gemini positions everything */}
      <div className="relative w-full min-h-screen">
        {components.map((component) => (
          <div
            key={component.id}
            style={{
              position: "absolute",
              left: component.position.x,
              top: component.position.y,
              width: component.position.width,
              height: component.position.height,
            }}
            className="pointer-events-auto"
          >
            <ComponentRenderer component={component} />
          </div>
        ))}
      </div>
    </div>
  );
}

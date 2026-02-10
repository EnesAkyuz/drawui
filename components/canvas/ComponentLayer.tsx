"use client";

import { useMemo } from "react";
import { getComponentFromRegistry } from "@/lib/component-registry.client";
import type { GeneratedComponent } from "@/types/canvas";

interface ComponentLayerProps {
  component: GeneratedComponent;
}

export default function ComponentLayer({ component }: ComponentLayerProps) {
  const ComponentToRender = useMemo(
    () => getComponentFromRegistry(component.type),
    [component.type],
  );

  if (!ComponentToRender) {
    return (
      <div
        style={{
          position: "absolute",
          left: component.position.x,
          top: component.position.y,
          width: component.position.width,
          height: component.position.height,
        }}
        className="border border-dashed border-red-500 flex items-center justify-center text-xs text-red-500"
      >
        {component.type}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: component.position.x,
        top: component.position.y,
        width: component.position.width,
        height: component.position.height,
      }}
      className="pointer-events-auto"
    >
      <ComponentToRender {...component.props} />
    </div>
  );
}

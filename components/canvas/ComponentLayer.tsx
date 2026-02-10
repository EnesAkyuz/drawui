"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { GripVertical } from "lucide-react";
import { getComponentFromRegistry } from "@/lib/component-registry.client";
import type { GeneratedComponent } from "@/types/canvas";

interface ComponentLayerProps {
  component: GeneratedComponent;
  onPositionChange?: (id: string, x: number, y: number) => void;
}

export default function ComponentLayer({ component, onPositionChange }: ComponentLayerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: component.position.x, y: component.position.y });
  const dragStartPos = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  const ComponentToRender = useMemo(
    () => getComponentFromRegistry(component.type),
    [component.type],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      const newX = dragStartPos.current.initialX + deltaX;
      const newY = dragStartPos.current.initialY + deltaY;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onPositionChange) {
        onPositionChange(component.id, position.x, position.y);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, component.id, position.x, position.y, onPositionChange]);

  if (!ComponentToRender) {
    return (
      <div
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
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
        left: position.x,
        top: position.y,
        width: component.position.width,
        height: component.position.height,
      }}
      className={`pointer-events-auto group ${isDragging ? "z-50" : "z-10"}`}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute -top-6 left-0 right-0 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
      >
        <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs flex items-center gap-1">
          <GripVertical className="h-3 w-3" />
          Drag to move
        </div>
      </div>

      {/* Component Wrapper with hover effect */}
      <div className="relative w-full h-full group-hover:ring-2 group-hover:ring-primary/50 rounded transition-all">
        <ComponentToRender {...component.props} />
      </div>
    </div>
  );
}

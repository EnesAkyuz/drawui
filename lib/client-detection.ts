/**
 * Client-side shape detection for instant UI component suggestions
 * before AI enhancement
 */

import type { GeminiComponentResponse } from "@/types/canvas";

export interface DetectedShape {
  type: "rectangle" | "circle" | "line" | "text";
  bounds: { x: number; y: number; width: number; height: number };
  aspectRatio: number;
}

/**
 * Analyze Excalidraw elements and detect likely UI components
 */
export function detectUIComponents(
  elements: readonly any[],
): GeminiComponentResponse[] {
  const shapes = extractShapes(elements);
  const components: GeminiComponentResponse[] = [];

  for (const shape of shapes) {
    const component = shapeToComponent(shape);
    if (component) {
      components.push(component);
    }
  }

  return components;
}

/**
 * Extract shape information from Excalidraw elements
 */
function extractShapes(elements: readonly any[]): DetectedShape[] {
  return elements
    .filter((el) => !el.isDeleted && el.width > 20 && el.height > 20)
    .map((el) => {
      const aspectRatio = el.width / el.height;

      return {
        type: getShapeType(el.type),
        bounds: {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
        },
        aspectRatio,
      };
    });
}

/**
 * Map Excalidraw element type to our shape type
 */
function getShapeType(
  excalidrawType: string,
): "rectangle" | "circle" | "line" | "text" {
  if (excalidrawType === "ellipse") return "circle";
  if (excalidrawType === "arrow" || excalidrawType === "line") return "line";
  if (excalidrawType === "text") return "text";
  return "rectangle";
}

/**
 * Convert detected shape to likely UI component
 */
function shapeToComponent(
  shape: DetectedShape,
): GeminiComponentResponse | null {
  const { type, bounds, aspectRatio } = shape;

  // Text elements
  if (type === "text") {
    return {
      type: "label",
      position: bounds,
      props: {
        children: "Label",
        className: "text-sm font-medium",
      },
    };
  }

  // Skip lines for now
  if (type === "line") {
    return null;
  }

  // Rectangles - detect component type by aspect ratio and size
  if (type === "rectangle") {
    const area = bounds.width * bounds.height;

    // Very wide rectangles = input fields
    if (aspectRatio > 4) {
      return {
        type: "input",
        position: bounds,
        props: {
          placeholder: "Enter text...",
          className: "w-full",
        },
      };
    }

    // Square-ish, large = card
    if (aspectRatio > 0.8 && aspectRatio < 1.2 && area > 40000) {
      return {
        type: "card",
        position: bounds,
        props: {
          className: "p-6",
          children: "Card content",
        },
      };
    }

    // Small rectangles = buttons
    if (area < 15000) {
      return {
        type: "button",
        position: bounds,
        props: {
          variant: "default",
          children: "Button",
        },
      };
    }

    // Medium rectangles = larger buttons or inputs
    if (aspectRatio > 2) {
      return {
        type: "input",
        position: bounds,
        props: {
          placeholder: "Input field",
        },
      };
    }

    // Default to button
    return {
      type: "button",
      position: bounds,
      props: {
        variant: "outline",
        children: "Button",
      },
    };
  }

  // Circles - could be avatar or icon
  if (type === "circle") {
    if (bounds.width < 60) {
      // Small circle = button or icon
      return {
        type: "button",
        position: bounds,
        props: {
          variant: "ghost",
          size: "icon",
          children: "○",
        },
      };
    }

    // Larger circle = avatar
    return {
      type: "avatar",
      position: bounds,
      props: {
        className: "h-12 w-12",
      },
    };
  }

  return null;
}

/**
 * Create a cache key from elements
 */
export function createElementsHash(elements: readonly any[]): string {
  const significant = elements
    .filter((el) => !el.isDeleted)
    .map((el) => ({
      type: el.type,
      x: Math.round(el.x / 10) * 10, // Round to reduce cache misses
      y: Math.round(el.y / 10) * 10,
      w: Math.round(el.width / 10) * 10,
      h: Math.round(el.height / 10) * 10,
    }));

  return JSON.stringify(significant);
}

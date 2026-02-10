import fs from "node:fs";
import path from "node:path";
import type React from "react";

// Dynamically discover installed shadcn components
export function getInstalledComponents(): string[] {
  const uiDir = path.join(process.cwd(), "components/ui");

  if (!fs.existsSync(uiDir)) {
    return [];
  }

  const files = fs.readdirSync(uiDir);

  return files
    .filter((f) => f.endsWith(".tsx") && f !== "index.tsx")
    .map((f) => f.replace(".tsx", "").toLowerCase())
    .sort();
}

// Dynamic component imports (client-side)
// This will be populated at runtime
export const componentRegistry: Record<string, React.ComponentType<any>> = {};

// Client-side component loader
export async function loadComponentRegistry() {
  const components = getInstalledComponents();

  for (const name of components) {
    try {
      const module = await import(`@/components/ui/${name}`);
      const ComponentName =
        name.charAt(0).toUpperCase() +
        name.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      componentRegistry[name] = module[ComponentName] || module.default;
    } catch (error) {
      console.warn(`Failed to load component: ${name}`, error);
    }
  }

  return componentRegistry;
}

'use client';

import { useEffect, useState } from 'react';
import type { GeneratedComponent } from '@/types/canvas';
import { loadComponentRegistry } from '@/lib/component-registry';

interface ComponentLayerProps {
  component: GeneratedComponent;
}

export default function ComponentLayer({ component }: ComponentLayerProps) {
  const [ComponentToRender, setComponentToRender] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    loadComponentRegistry().then((registry) => {
      const Component = registry[component.type];
      if (Component) {
        setComponentToRender(() => Component);
      } else {
        console.warn(`Component not found in registry: ${component.type}`);
      }
    });
  }, [component.type]);

  if (!ComponentToRender) {
    return (
      <div
        style={{
          position: 'absolute',
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
        position: 'absolute',
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

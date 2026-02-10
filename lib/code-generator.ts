import type { GeneratedComponent } from '@/types/canvas';

export function extractUsedComponents(components: GeneratedComponent[]): string[] {
  const types = new Set(components.map(c => c.type));
  return Array.from(types).sort();
}

function capitalize(str: string): string {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function formatProps(props: Record<string, any>): string {
  return Object.entries(props)
    .map(([key, value]) => {
      if (key === 'children') {
        return null; // Handle children separately
      }

      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }

      if (typeof value === 'boolean') {
        return value ? key : null;
      }

      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter(Boolean)
    .join(' ');
}

function generateComponentJSX(component: GeneratedComponent): string {
  const ComponentName = capitalize(component.type);
  const propsStr = formatProps(component.props);
  const children = component.props.children || '';

  const style = {
    position: 'absolute' as const,
    left: component.position.x,
    top: component.position.y,
    width: component.position.width,
    height: component.position.height,
  };

  const styleStr = JSON.stringify(style, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");

  if (children) {
    return `      <${ComponentName} ${propsStr} style={${styleStr}}>
        ${children}
      </${ComponentName}>`;
  }

  return `      <${ComponentName} ${propsStr} style={${styleStr}} />`;
}

export function generateReactCode(components: GeneratedComponent[]): string {
  if (components.length === 0) {
    return `export default function GeneratedUI() {
  return (
    <div className="relative w-full h-screen">
      <p className="text-muted-foreground p-4">No components generated yet</p>
    </div>
  );
}`;
  }

  const usedComponents = extractUsedComponents(components);
  const componentNames = usedComponents.map(capitalize);

  const imports = `import { ${componentNames.join(', ')} } from '@/components/ui';`;

  const jsxComponents = components.map(generateComponentJSX).join('\n\n');

  return `${imports}

export default function GeneratedUI() {
  return (
    <div className="relative w-full h-screen">
${jsxComponents}
    </div>
  );
}`;
}

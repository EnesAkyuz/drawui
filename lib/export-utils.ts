import { toast } from "sonner";

interface ExportOptions {
  code: string;
  componentName?: string;
}

// Export to CodeSandbox
export async function exportToCodeSandbox({ code, componentName = "GeneratedWebsite" }: ExportOptions) {
  const files = {
    "package.json": {
      content: {
        name: "drawui-export",
        version: "1.0.0",
        description: "Exported from DrawUI",
        dependencies: {
          "react": "^19.0.0",
          "react-dom": "^19.0.0",
          "tailwindcss": "^4.0.0",
        },
        devDependencies: {
          "@vitejs/plugin-react": "^4.0.0",
          "vite": "^5.0.0",
        },
      },
    },
    "index.html": {
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DrawUI Export</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    },
    "src/main.tsx": {
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    },
    "src/App.tsx": {
      content: code,
    },
    "src/index.css": {
      content: `@import "tailwindcss";`,
    },
    "tailwind.config.js": {
      content: `export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`,
    },
  };

  const parameters = {
    files,
  };

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://codesandbox.io/api/v1/sandboxes/define";
  form.target = "_blank";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "parameters";
  input.value = JSON.stringify(parameters);

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  toast.success("Opening in CodeSandbox...");
}

// Export to StackBlitz
export async function exportToStackBlitz({ code }: ExportOptions) {
  const project = {
    title: "DrawUI Export",
    description: "Exported from DrawUI",
    template: "node",
    files: {
      "package.json": JSON.stringify(
        {
          name: "drawui-export",
          version: "1.0.0",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "^19.0.0",
            "react-dom": "^19.0.0",
            tailwindcss: "^4.0.0",
          },
          devDependencies: {
            "@vitejs/plugin-react": "^4.0.0",
            vite: "^5.0.0",
          },
        },
        null,
        2
      ),
      "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DrawUI Export</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      "src/main.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      "src/App.tsx": code,
      "src/index.css": `@import "tailwindcss";`,
      "tailwind.config.js": `export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`,
      "vite.config.ts": `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`,
    },
  };

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://stackblitz.com/run";
  form.target = "_blank";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "project[files]";
  input.value = JSON.stringify(project.files);

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  toast.success("Opening in StackBlitz...");
}

// Export as standalone HTML
export function exportAsHTML({ code }: ExportOptions) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DrawUI Export</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
${code}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<GeneratedWebsite />);
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "drawui-export.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.success("HTML file downloaded!");
}

// Export complete project as ZIP
export function exportAsProject({ code }: ExportOptions) {
  // Note: This would require a ZIP library like JSZip
  // For now, we'll just show what files would be included
  const files = {
    "package.json": JSON.stringify(
      {
        name: "drawui-export",
        version: "1.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          tailwindcss: "^4.0.0",
        },
        devDependencies: {
          "@vitejs/plugin-react": "^4.0.0",
          typescript: "^5.0.0",
          vite: "^5.0.0",
        },
      },
      null,
      2
    ),
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DrawUI Export</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    "src/main.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    "src/App.tsx": code,
    "src/index.css": `@import "tailwindcss";`,
    "src/vite-env.d.ts": `/// <reference types="vite/client" />`,
    "tsconfig.json": JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ["src"],
      },
      null,
      2
    ),
    "vite.config.ts": `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`,
    "tailwind.config.js": `export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`,
    "README.md": `# DrawUI Export

This project was exported from DrawUI.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`
`,
  };

  toast.info("Project export coming soon!", {
    description: "ZIP export requires additional dependencies",
  });

  // For now, just download the main App.tsx
  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "App.tsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

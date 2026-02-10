"use client";

import { useEffect, useRef, useState } from "react";

interface CodePreviewProps {
  code: string;
}

export default function CodePreview({ code }: CodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iframeRef.current || !code) return;

    try {
      // Transform the React component code into executable HTML
      const transformedCode = transformReactToHTML(code);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>

  <script type="text/babel">
    const { useState, useEffect, useCallback, useMemo, useRef } = React;

    ${transformedCode}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(GeneratedWebsite));
  <\/script>
</body>
</html>`;

      console.log("Setting iframe srcdoc");
      iframeRef.current.srcdoc = html;
      setError(null);
    } catch (err) {
      console.error("Preview error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [code]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-destructive">
          <p className="font-semibold">Preview Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="Website Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

function transformReactToHTML(code: string): string {
  // Remove export default and TypeScript types
  let transformed = code
    .replace(/^export\s+default\s+/, "")
    .replace(/:\s*React\.FC<[^>]*>/g, "")
    .replace(/:\s*\w+(\[\])?/g, ""); // Remove type annotations

  return transformed;
}

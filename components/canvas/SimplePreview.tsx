"use client";

import { useEffect, useRef } from "react";

interface SimplePreviewProps {
  code: string;
}

export default function SimplePreview({ code }: SimplePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !code) {
      console.log("Preview: No iframe or no code");
      return;
    }

    console.log("Preview: Rendering code, length:", code.length);
    console.log("Preview: First 100 chars:", code.substring(0, 100));

    // Extract JSX content from the component
    const jsxContent = extractJSXContent(code);

    if (!jsxContent) {
      console.error("Preview: Could not extract JSX content");
      return;
    }

    console.log("Preview: Extracted JSX, length:", jsxContent.length);

    // Convert JSX to plain HTML (very basic conversion)
    const html = convertJSXToHTML(jsxContent);

    const fullHTML = `<!DOCTYPE html>
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
  ${html}
</body>
</html>`;

    console.log("Preview: Setting iframe HTML");
    iframeRef.current.srcdoc = fullHTML;
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="Website Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

function extractJSXContent(code: string): string | null {
  // Try to find the return statement and extract the JSX
  const returnMatch = code.match(/return\s*\(([\s\S]*)\);?\s*}/);
  if (returnMatch) {
    return returnMatch[1].trim();
  }

  // Try to find JSX between parentheses
  const jsxMatch = code.match(/return\s*\(([\s\S]*)\)/);
  if (jsxMatch) {
    return jsxMatch[1].trim();
  }

  return null;
}

function convertJSXToHTML(jsx: string): string {
  // Very basic JSX to HTML conversion
  let html = jsx;

  // Replace className with class
  html = html.replace(/className=/g, "class=");

  // Remove React fragments
  html = html.replace(/<>/g, "<div>");
  html = html.replace(/<\/>/g, "</div>");

  // Handle self-closing tags (add space before />)
  html = html.replace(/([^\/\s])\/>/g, "$1 />");

  return html;
}

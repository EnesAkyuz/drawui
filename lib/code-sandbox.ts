/**
 * Code sandbox execution - runs generated code and captures runtime errors
 */

interface SandboxWindow extends Window {
  console: Console;
}

interface SandboxResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  logs: string[];
}

/**
 * Runs code in an iframe sandbox and captures runtime errors
 */
export async function runInSandbox(code: string): Promise<SandboxResult> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const logs: string[] = [];

    // Create isolated iframe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.sandbox.add("allow-scripts");
    document.body.appendChild(iframe);

    try {
      const iframeWindow = iframe.contentWindow as SandboxWindow | null;
      if (!iframeWindow) {
        throw new Error("Failed to create iframe window");
      }

      // Capture console errors and warnings
      const originalConsoleError = iframeWindow.console.error;
      const originalConsoleWarn = iframeWindow.console.warn;
      const originalConsoleLog = iframeWindow.console.log;

      iframeWindow.console.error = (...args: any[]) => {
        errors.push(args.map((a) => String(a)).join(" "));
        originalConsoleError.apply(iframeWindow.console, args);
      };

      iframeWindow.console.warn = (...args: any[]) => {
        warnings.push(args.map((a) => String(a)).join(" "));
        originalConsoleWarn.apply(iframeWindow.console, args);
      };

      iframeWindow.console.log = (...args: any[]) => {
        logs.push(args.map((a) => String(a)).join(" "));
        originalConsoleLog.apply(iframeWindow.console, args);
      };

      // Capture global errors
      iframeWindow.addEventListener("error", (event) => {
        errors.push(
          `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
        );
      });

      // Prepare code for execution
      const testCode = `
        try {
          ${code}

          // Try to instantiate the component
          if (typeof GeneratedWebsite !== 'undefined') {
            console.log('✅ Component definition found');
          } else {
            console.error('❌ GeneratedWebsite component not exported');
          }
        } catch (err) {
          console.error('Runtime error:', err.message, err.stack);
        }
      `;

      // Execute in iframe
      const script = iframeWindow.document.createElement("script");
      script.textContent = testCode;
      iframeWindow.document.body.appendChild(script);

      // Give it time to execute
      setTimeout(() => {
        document.body.removeChild(iframe);
        resolve({
          success: errors.length === 0,
          errors,
          warnings,
          logs,
        });
      }, 1000);
    } catch (err) {
      document.body.removeChild(iframe);
      resolve({
        success: false,
        errors: [err instanceof Error ? err.message : "Unknown error"],
        warnings,
        logs,
      });
    }
  });
}

/**
 * Validates React component code by transpiling and testing
 */
export async function validateReactComponent(code: string): Promise<{
  valid: boolean;
  errors: string[];
  suggestions: string[];
}> {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check for required patterns
  if (!code.includes('"use client"') && !code.includes("'use client'")) {
    errors.push(
      'Missing "use client" directive - required for client components',
    );
    suggestions.push('Add "use client" at the top of the file');
  }

  if (!code.includes("export default function GeneratedWebsite")) {
    errors.push(
      "Component must be named GeneratedWebsite and exported as default",
    );
    suggestions.push("Use: export default function GeneratedWebsite() { ... }");
  }

  if (!code.includes("return")) {
    errors.push("Component has no return statement");
    suggestions.push("Add a return statement with JSX");
  }

  // Check for common React mistakes
  if (code.includes("class=")) {
    errors.push('Using HTML "class" instead of JSX "className"');
    suggestions.push("Replace class= with className=");
  }

  if (code.includes("for=")) {
    errors.push('Using HTML "for" instead of JSX "htmlFor"');
    suggestions.push("Replace for= with htmlFor=");
  }

  // Check for unclosed JSX tags
  const jsxOpenCount = (code.match(/<[A-Z][a-zA-Z0-9.]*/g) || []).length;
  const jsxCloseCount = (code.match(/<\/[A-Z][a-zA-Z0-9.]*>/g) || []).length;
  const selfClosingCount = (code.match(/<[A-Z][a-zA-Z0-9.]*[^>]*\/>/g) || [])
    .length;

  if (jsxOpenCount > jsxCloseCount + selfClosingCount) {
    errors.push("Possible unclosed JSX tags detected");
    suggestions.push("Check that all JSX tags are properly closed");
  }

  return {
    valid: errors.length === 0,
    errors,
    suggestions,
  };
}

/**
 * Formats errors for AI to understand and fix
 */
export function formatErrorsForAI(
  sandboxResult: SandboxResult,
  validationResult: { errors: string[]; suggestions: string[] },
): string {
  let message = "🚨 CODE EXECUTION FAILED - FIX REQUIRED:\n\n";

  if (validationResult.errors.length > 0) {
    message += "📋 VALIDATION ERRORS:\n";
    validationResult.errors.forEach((err, i) => {
      message += `${i + 1}. ${err}\n`;
    });
    message += "\n";
  }

  if (sandboxResult.errors.length > 0) {
    message += "💥 RUNTIME ERRORS:\n";
    sandboxResult.errors.forEach((err, i) => {
      message += `${i + 1}. ${err}\n`;
    });
    message += "\n";
  }

  if (validationResult.suggestions.length > 0) {
    message += "💡 HOW TO FIX:\n";
    validationResult.suggestions.forEach((sug, i) => {
      message += `${i + 1}. ${sug}\n`;
    });
    message += "\n";
  }

  message += "⚠️ Generate a CORRECTED version that fixes ALL these issues.\n";
  message += "Return ONLY the fixed code with NO explanations.\n";

  return message;
}

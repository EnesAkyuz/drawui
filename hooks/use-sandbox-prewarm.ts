"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface SandboxState {
  isInitializing: boolean;
  isReady: boolean;
  sandboxId: string | null;
  url: string | null;
  error: string | null;
}

/**
 * Hook to pre-warm an E2B sandbox on page load.
 * Automatically initializes the sandbox and cleans up on unmount.
 */
export function useSandboxPrewarm() {
  const [state, setState] = useState<SandboxState>({
    isInitializing: false,
    isReady: false,
    sandboxId: null,
    url: null,
    error: null,
  });

  const initStarted = useRef(false);
  const sandboxIdRef = useRef<string | null>(null);

  const initSandbox = useCallback(async () => {
    if (initStarted.current) return;
    initStarted.current = true;

    setState((prev) => ({ ...prev, isInitializing: true }));

    try {
      // First check if already initialized
      const checkRes = await fetch("/api/sandbox-init");
      const checkData = await checkRes.json();

      if (checkData.ready) {
        sandboxIdRef.current = checkData.sandboxId;
        setState({
          isInitializing: false,
          isReady: true,
          sandboxId: checkData.sandboxId,
          url: checkData.url,
          error: null,
        });
        return;
      }

      // Initialize sandbox
      const res = await fetch("/api/sandbox-init", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to initialize sandbox");
      }

      sandboxIdRef.current = data.sandboxId;
      setState({
        isInitializing: false,
        isReady: true,
        sandboxId: data.sandboxId,
        url: data.url,
        error: null,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        error: errMsg,
      }));
    }
  }, []);

  const killSandbox = useCallback(async () => {
    if (!sandboxIdRef.current) return;

    try {
      await fetch("/api/sandbox-kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId: sandboxIdRef.current }),
        // Use keepalive to ensure request completes even if page is unloading
        keepalive: true,
      });
    } catch {
      // Ignore errors during cleanup
    }
  }, []);

  useEffect(() => {
    // Start initializing sandbox on mount
    initSandbox();

    // Cleanup on unmount
    return () => {
      killSandbox();
    };
  }, [initSandbox, killSandbox]);

  // Also handle page unload (for hard refreshes, tab close, etc.)
  useEffect(() => {
    const handleUnload = () => {
      if (sandboxIdRef.current) {
        // Use sendBeacon for reliable cleanup on page unload
        navigator.sendBeacon(
          "/api/sandbox-kill",
          JSON.stringify({ sandboxId: sandboxIdRef.current }),
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return {
    ...state,
    refresh: () => {
      initStarted.current = false;
      initSandbox();
    },
  };
}

"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useGenerationHistory } from "@/hooks/use-generation-history";
import { useSandboxPrewarm } from "@/hooks/use-sandbox-prewarm";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { E2BPreview } from "@/components/preview/E2BPreview";
import type { CanvasMode } from "@/types/canvas";
import {
  compressImage,
  estimateImageSize,
  formatBytes,
} from "@/lib/image-utils";
import { RateLimiter } from "@/lib/rate-limiter";
import { sketchCache, hashImage, createCacheKey } from "@/lib/sketch-cache";
import {
  validateGeneratedCode,
  attemptCodeFix,
  showValidationFeedback,
} from "@/lib/code-validator";
import { autoInstallComponents, suggestImportFixes } from "@/lib/auto-install";

// Dynamic import to avoid SSR issues with Excalidraw
const ExcalidrawWrapper = dynamic(() => import("./ExcalidrawWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

export default function DrawingCanvas() {
  const [mode, setMode] = useState<CanvasMode>("drawing");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [pendingImageData, setPendingImageData] = useState<string>("");
  const [imageSize, setImageSize] = useState<number>(0);
  const [styleGuide, setStyleGuide] = useState<string>("Modern & Professional");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [, setQualityScore] = useState<number>(0);
  const [streamingLogs, setStreamingLogs] = useState<string[]>([]);
  const [, setStreamingCode] = useState<string>("");
  const [, setCurrentIteration] = useState<number>(0);
  const [e2bSandboxUrl, setE2bSandboxUrl] = useState<string | null>(null);
  const [e2bSandboxId, setE2bSandboxId] = useState<string | undefined>(
    undefined,
  );
  const [colorPalette, setColorPalette] = useState({
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899",
    background: "#ffffff",
    text: "#1f2937",
  });

  // Rate limiter: 5 requests per minute
  const rateLimiter = useMemo(() => new RateLimiter(5, 60000), []);

  // Pre-warm E2B sandbox on page load
  const {
    isInitializing: sandboxInitializing,
    url: prewarmedUrl,
    sandboxId: prewarmedSandboxId,
  } = useSandboxPrewarm();

  // Use pre-warmed sandbox as fallback when no generated sandbox exists
  const activeSandboxUrl = e2bSandboxUrl || prewarmedUrl;
  const activeSandboxId = e2bSandboxId || prewarmedSandboxId || undefined;

  // Generation history
  const history = useGenerationHistory();
  const generationStartTime = useRef<number>(0);

  // Capture and compress image data
  const handleCapture = useCallback(
    async (imageData: string, _elementsHash: string) => {
      if (imageData) {
        setIsCompressing(true);
        try {
          const originalSize = estimateImageSize(imageData);
          const compressed = await compressImage(imageData);
          const compressedSize = estimateImageSize(compressed);

          setPendingImageData(compressed);
          setImageSize(compressedSize);

          console.log(
            `📸 Canvas captured - Original: ${formatBytes(originalSize)}, Compressed: ${formatBytes(compressedSize)}`,
          );
        } catch (error) {
          console.error("Image compression error:", error);
          setPendingImageData(imageData);
          setImageSize(estimateImageSize(imageData));
        } finally {
          setIsCompressing(false);
        }
      }
    },
    [],
  );

  const handleE2BGenerationComplete = useCallback(
    async (
      code: string,
      sandboxUrl: string | undefined,
      sandboxId: string | undefined,
      iterations: number,
    ) => {
      const endTime = performance.now();
      const duration = (endTime - generationStartTime.current) / 1000;

      setGeneratedCode(code);
      setE2bSandboxUrl(sandboxUrl || null);
      setE2bSandboxId(sandboxId);
      setMode("preview");

      history.addEntry({
        code,
        thumbnail: pendingImageData,
        styleGuide,
        customPrompt,
        colorPalette,
        generationTime: duration,
      });

      toast.success("🚀 E2B Sandbox ready!", {
        description: sandboxUrl
          ? `Live preview running • ${iterations} iteration${iterations > 1 ? "s" : ""}`
          : `Code generated • ${iterations} iteration${iterations > 1 ? "s" : ""}`,
      });
    },
    [pendingImageData, styleGuide, customPrompt, colorPalette, history],
  );

  const handleLiveGenerationError = useCallback((error: string) => {
    setStreamingLogs((prev) => [...prev, `❌ Error: ${error}`]);
    toast.error("Generation failed", {
      description: error,
    });
  }, []);

  // Manual generation triggered by button with rate limiting
  const handleGenerate = useCallback(async () => {
    if (!pendingImageData) {
      toast.error("No drawing to analyze", {
        description: "Draw something on the canvas first",
      });
      return;
    }

    // Check cache first
    const imageHash = hashImage(pendingImageData);
    const cacheKey = createCacheKey(
      imageHash,
      styleGuide,
      customPrompt,
      colorPalette,
    );
    const cachedCode = sketchCache.get(cacheKey);

    if (cachedCode) {
      setGeneratedCode(cachedCode);
      setMode("preview");
      toast.success("Loaded from cache!", {
        description: "Identical sketch found",
      });

      history.addEntry({
        code: cachedCode,
        thumbnail: pendingImageData,
        styleGuide,
        customPrompt,
        colorPalette,
        generationTime: 0,
      });

      return;
    }

    // Check rate limit
    if (!rateLimiter.canMakeRequest()) {
      const resetTime = Math.ceil(rateLimiter.getResetTime() / 1000);
      toast.error("Rate limit exceeded", {
        description: `Please wait ${resetTime} seconds before generating again`,
      });
      return;
    }

    generationStartTime.current = performance.now();
    rateLimiter.recordRequest();
    setIsAnalyzing(true);

    // Reset streaming state
    setStreamingLogs([]);
    setStreamingCode("");
    setCurrentIteration(0);
    // Keep the sandbox URL/ID if we have a pre-warmed one
    if (!prewarmedSandboxId) {
      setE2bSandboxUrl(null);
      setE2bSandboxId(undefined);
    }

    // Start streaming generation with E2B (use existing sandbox if available)
    fetch("/api/generate-e2b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: pendingImageData,
        styleGuide,
        customPrompt,
        colorPalette,
        sandboxId: activeSandboxId, // Pass existing sandbox ID for reuse
      }),
    })
      .then(async (response) => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          toast.error("Failed to start generation");
          setIsAnalyzing(false);
          return;
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("event:")) {
              const event = line.substring(7).trim();
              const dataLineIndex = lines.indexOf(line) + 1;
              const dataLine = lines[dataLineIndex];

              if (dataLine?.startsWith("data:")) {
                const data = JSON.parse(dataLine.substring(6));

                switch (event) {
                  case "start":
                    setStreamingLogs((prev) => [...prev, data.message]);
                    break;

                  case "iteration":
                    setCurrentIteration(data.current);
                    setStreamingLogs((prev) => [
                      ...prev,
                      `\n🔄 Iteration ${data.current}/${data.max}`,
                    ]);
                    break;

                  case "log":
                    setStreamingLogs((prev) => [...prev, data.message]);
                    break;

                  case "code":
                    setStreamingCode(data.code);
                    break;

                  case "quality":
                    setQualityScore(data.score);
                    break;

                  case "sandbox":
                    // E2B sandbox is ready
                    setE2bSandboxUrl(data.url);
                    setE2bSandboxId(data.sandboxId);
                    break;

                  case "complete":
                    await handleE2BGenerationComplete(
                      data.code,
                      data.sandboxUrl,
                      data.sandboxId,
                      data.iterations,
                    );
                    setIsAnalyzing(false);
                    break;

                  case "error":
                    handleLiveGenerationError(data.message);
                    setIsAnalyzing(false);
                    break;
                }
              }
            }
          }
        }
      })
      .catch((err) => {
        handleLiveGenerationError(err.message);
        setIsAnalyzing(false);
      });
  }, [
    pendingImageData,
    styleGuide,
    customPrompt,
    colorPalette,
    rateLimiter,
    activeSandboxId,
    prewarmedSandboxId,
    handleE2BGenerationComplete,
    handleLiveGenerationError,
    history.addEntry,
  ]);

  const toggleMode = () => {
    setMode((prev) => (prev === "drawing" ? "preview" : "drawing"));
  };

  // Handle history navigation
  const handleSelectHistoryEntry = useCallback(
    (id: string) => {
      const entry = history.goToEntryById(id);
      if (entry) {
        setGeneratedCode(entry.code);
        setStyleGuide(entry.styleGuide);
        setCustomPrompt(entry.customPrompt || "");
        setColorPalette(entry.colorPalette);
        // Clear e2b state - user can regenerate to get live preview
        setE2bSandboxUrl(null);
        setE2bSandboxId(undefined);
        setMode("preview");
        toast.success("Restored from history", {
          description: "Click Generate to get a live preview",
        });
      }
    },
    [history],
  );

  const handleUndo = useCallback(() => {
    const entry = history.undo();
    if (entry) {
      setGeneratedCode(entry.code);
      setStyleGuide(entry.styleGuide);
      setCustomPrompt(entry.customPrompt || "");
      setColorPalette(entry.colorPalette);
      // Clear e2b state - user can regenerate to get live preview
      setE2bSandboxUrl(null);
      setE2bSandboxId(undefined);
      setMode("preview");
      toast.success("Undone");
    }
  }, [history]);

  const handleRedo = useCallback(() => {
    const entry = history.redo();
    if (entry) {
      setGeneratedCode(entry.code);
      setStyleGuide(entry.styleGuide);
      setCustomPrompt(entry.customPrompt || "");
      setColorPalette(entry.colorPalette);
      // Clear e2b state - user can regenerate to get live preview
      setE2bSandboxUrl(null);
      setE2bSandboxId(undefined);
      setMode("preview");
      toast.success("Redone");
    }
  }, [history]);

  // Handle keyboard shortcuts
  const handleShortcut = useCallback(
    (action: string) => {
      switch (action) {
        case "undo":
          handleUndo();
          break;
        case "redo":
          handleRedo();
          break;
        case "generate":
          handleGenerate();
          break;
        case "togglePreview":
          toggleMode();
          break;
        default:
          break;
      }
    },
    [handleUndo, handleRedo, handleGenerate, toggleMode],
  );

  // Handle terminal commands in E2B sandbox
  const handleRunCommand = useCallback(
    async (
      command: string,
    ): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
      if (!e2bSandboxId) {
        return { stdout: "", stderr: "No active sandbox", exitCode: 1 };
      }

      const response = await fetch("/api/sandbox-terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId: e2bSandboxId, command }),
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          stdout: "",
          stderr: result.error || "Command failed",
          exitCode: 1,
        };
      }
      return result;
    },
    [e2bSandboxId],
  );

  // Basic keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleUndo, handleRedo]);

  return (
    <SidebarProvider>
      {/* Sidebar */}
      <AppSidebar
        mode={mode}
        onModeChange={setMode}
        isGenerating={isAnalyzing}
        isCompressing={isCompressing}
        canGenerate={!!pendingImageData}
        onGenerate={handleGenerate}
        hasCode={!!generatedCode}
        styleGuide={styleGuide}
        onStyleGuideChange={setStyleGuide}
        customPrompt={customPrompt}
        onCustomPromptChange={setCustomPrompt}
        colorPalette={colorPalette}
        onColorPaletteChange={setColorPalette}
        historyEntries={history.entries}
        currentHistoryIndex={history.currentIndex}
        onSelectHistoryEntry={handleSelectHistoryEntry}
        onDeleteHistoryEntry={history.deleteEntry}
        onClearHistory={history.clearHistory}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        imageSize={imageSize}
        remainingRequests={rateLimiter.getRemainingRequests()}
        generatedCode={generatedCode}
        onShortcut={handleShortcut}
      />

      {/* Main Content */}
      <SidebarInset className="flex flex-col">
        {/* Top Bar with Trigger */}
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 z-10">
          <SidebarTrigger />
          <div className="flex items-center gap-2 flex-1">
            <div className="text-sm font-medium">
              {mode === "drawing" ? "Drawing Mode" : "Preview Mode"}
            </div>
            {/* Sandbox pre-warm status */}
            {sandboxInitializing && (
              <Badge
                variant="outline"
                className="ml-2 text-blue-600 border-blue-600"
              >
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Preparing sandbox...
              </Badge>
            )}
            {activeSandboxUrl && (
              <Badge
                variant="outline"
                className="ml-2 text-green-600 border-green-600"
              >
                {e2bSandboxUrl ? "🟢 Live" : "⚡ Sandbox ready"}
              </Badge>
            )}
            {generatedCode && !activeSandboxUrl && (
              <Badge variant="outline" className="ml-2 text-muted-foreground">
                Code Only
              </Badge>
            )}
            {generatedCode && (
              <div className="ml-auto flex items-center gap-2">
                {isCompressing && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Optimizing...
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden" id="main-content">
          {/* Canvas/Preview Area */}
          <main className="flex-1 relative" aria-label="Drawing canvas area">
            {/* Excalidraw Canvas - always mounted to preserve drawing state */}
            <div
              className={`w-full h-full absolute inset-0 ${mode === "drawing" ? "z-10" : "z-0 invisible"}`}
            >
              <ExcalidrawWrapper onCapture={handleCapture} />
            </div>

            {/* Website Preview */}
            <div
              className={`w-full h-full absolute inset-0 ${mode === "preview" ? "z-10" : "z-0 invisible"}`}
            >
              <E2BPreview
                sandboxUrl={activeSandboxUrl}
                sandboxId={activeSandboxId}
                isLoading={isAnalyzing}
                logs={streamingLogs}
                onRunCommand={handleRunCommand}
              />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

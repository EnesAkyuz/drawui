"use client";

import dynamic from "next/dynamic";
import { Eye, Loader2, Pencil, Palette, Sparkles, AlertCircle, Code2, Columns2 } from "lucide-react";
import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGenerationHistory } from "@/hooks/use-generation-history";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { ExportMenu } from "@/components/export/ExportMenu";
import { KeyboardShortcuts } from "@/components/accessibility/KeyboardShortcuts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SimplePreview from "./SimplePreview";
import { CodeBlock } from "@/components/ui/code-block";
import { DevicePreview } from "@/components/preview/DevicePreview";
import { ComparisonView } from "@/components/preview/ComparisonView";
import type { CanvasMode } from "@/types/canvas";
import { compressImage, estimateImageSize, formatBytes } from "@/lib/image-utils";
import { RateLimiter, debounce } from "@/lib/rate-limiter";
import { sketchCache, hashImage, createCacheKey } from "@/lib/sketch-cache";

const COLOR_PALETTES = {
  "Ocean Blue": {
    primary: "#0ea5e9",
    secondary: "#0284c7",
    accent: "#06b6d4",
    background: "#f0f9ff",
    text: "#0c4a6e"
  },
  "Sunset Orange": {
    primary: "#f97316",
    secondary: "#ea580c",
    accent: "#fb923c",
    background: "#fff7ed",
    text: "#7c2d12"
  },
  "Forest Green": {
    primary: "#10b981",
    secondary: "#059669",
    accent: "#34d399",
    background: "#f0fdf4",
    text: "#064e3b"
  },
  "Purple Dream": {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    accent: "#a78bfa",
    background: "#faf5ff",
    text: "#581c87"
  },
  "Rose Pink": {
    primary: "#ec4899",
    secondary: "#db2777",
    accent: "#f472b6",
    background: "#fdf2f8",
    text: "#831843"
  },
  "Monochrome": {
    primary: "#374151",
    secondary: "#1f2937",
    accent: "#6b7280",
    background: "#f9fafb",
    text: "#111827"
  },
  "Vibrant": {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899",
    background: "#ffffff",
    text: "#1f2937"
  }
} as const;

// Dynamic import to avoid SSR issues with Excalidraw
const ExcalidrawWrapper = dynamic(() => import("./ExcalidrawWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

type PreviewMode = "simple" | "device" | "comparison";

export default function DrawingCanvas() {
  const [mode, setMode] = useState<CanvasMode>("drawing");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("simple");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [pendingImageData, setPendingImageData] = useState<string>("");
  const [imageSize, setImageSize] = useState<number>(0);
  const [styleGuide, setStyleGuide] = useState<string>("Modern & Professional");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [showCodePanel, setShowCodePanel] = useState(true);
  const [colorPalette, setColorPalette] = useState({
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899",
    background: "#ffffff",
    text: "#1f2937"
  });

  // Rate limiter: 5 requests per minute
  const rateLimiter = useMemo(() => new RateLimiter(5, 60000), []);

  // Generation history
  const history = useGenerationHistory();
  const generationStartTime = useRef<number>(0);

  // Capture and compress image data
  const handleCapture = useCallback(
    async (imageData: string, elementsHash: string) => {
      if (imageData) {
        setIsCompressing(true);
        try {
          const originalSize = estimateImageSize(imageData);
          const compressed = await compressImage(imageData);
          const compressedSize = estimateImageSize(compressed);

          setPendingImageData(compressed);
          setImageSize(compressedSize);

          console.log(`📸 Canvas captured - Original: ${formatBytes(originalSize)}, Compressed: ${formatBytes(compressedSize)}`);
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

  // Manual generation triggered by button with rate limiting
  const handleGenerate = useCallback(async () => {
    if (!pendingImageData) {
      toast.error("No drawing to analyze", {
        description: "Draw something on the canvas first"
      });
      return;
    }

    // Check cache first
    const imageHash = hashImage(pendingImageData);
    const cacheKey = createCacheKey(imageHash, styleGuide, customPrompt, colorPalette);
    const cachedCode = sketchCache.get(cacheKey);

    if (cachedCode) {
      setGeneratedCode(cachedCode);
      setMode("preview");
      toast.success("Loaded from cache!", {
        description: "Identical sketch found"
      });

      // Still add to history
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
        description: `Please wait ${resetTime} seconds before generating again`
      });
      return;
    }

    generationStartTime.current = performance.now();
    setIsAnalyzing(true);

    // Record the request
    rateLimiter.recordRequest();

    // Show progress toast
    const loadingToast = toast.loading("Generating website...", {
      description: `Image size: ${formatBytes(imageSize)}`
    });

    try {
      const response = await fetch("/api/analyze-drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: pendingImageData,
          styleGuide,
          customPrompt,
          colorPalette
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate website");
      }

      const endTime = performance.now();
      const duration = (endTime - generationStartTime.current) / 1000;

      console.log(`🎨 Website generated in ${duration.toFixed(2)}s`);

      if (data.code) {
        setGeneratedCode(data.code);
        setMode("preview");

        // Cache the result
        sketchCache.set(cacheKey, {
          code: data.code,
          styleGuide,
          customPrompt,
          colorPalette,
        });

        // Add to history
        history.addEntry({
          code: data.code,
          thumbnail: pendingImageData,
          styleGuide,
          customPrompt,
          colorPalette,
          generationTime: duration,
        });

        toast.success("Website generated!", {
          description: `Completed in ${duration.toFixed(2)}s`
        });
      } else {
        throw new Error("No code received from API");
      }
    } catch (error) {
      console.error("Error generating website:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Generation failed", {
        description: errorMessage
      });
    } finally {
      setIsAnalyzing(false);
      toast.dismiss(loadingToast);
    }
  }, [pendingImageData, styleGuide, customPrompt, colorPalette, rateLimiter, imageSize, history]);

  const toggleMode = () => {
    setMode((prev) => (prev === "drawing" ? "preview" : "drawing"));
  };

  // Handle history navigation
  const handleSelectHistoryEntry = useCallback((id: string) => {
    const entry = history.goToEntryById(id);
    if (entry) {
      setGeneratedCode(entry.code);
      setStyleGuide(entry.styleGuide);
      setCustomPrompt(entry.customPrompt || "");
      setColorPalette(entry.colorPalette);
      setMode("preview");
      toast.success("Restored from history");
    }
  }, [history]);

  const handleUndo = useCallback(() => {
    const entry = history.undo();
    if (entry) {
      setGeneratedCode(entry.code);
      setStyleGuide(entry.styleGuide);
      setCustomPrompt(entry.customPrompt || "");
      setColorPalette(entry.colorPalette);
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
      setMode("preview");
      toast.success("Redone");
    }
  }, [history]);

  // Handle keyboard shortcuts
  const handleShortcut = useCallback((action: string) => {
    switch (action) {
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      case 'generate':
        handleGenerate();
        break;
      case 'togglePreview':
        toggleMode();
        break;
      case 'toggleCode':
        setShowCodePanel(prev => !prev);
        break;
      default:
        break;
    }
  }, [handleUndo, handleRedo, handleGenerate, toggleMode]);

  // Basic keyboard shortcuts (undo/redo still handled directly)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Skip if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleUndo, handleRedo]);

  return (
    <div className="flex flex-col h-screen">
      {/* Top Control Bar */}
      <div
        className="h-14 border-b bg-card px-4 flex items-center justify-between overflow-x-auto"
        role="toolbar"
        aria-label="Main toolbar"
      >
        <div className="flex gap-2 items-center">
          <Button
            variant={mode === "drawing" ? "default" : "outline"}
            size="sm"
            onClick={toggleMode}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Drawing</span>
          </Button>
          <Button
            variant={mode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={toggleMode}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>

          {/* Preview Mode Selector (only show in preview mode) */}
          {mode === "preview" && generatedCode && (
            <>
              <Button
                variant={previewMode === "comparison" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("comparison")}
                className="gap-2 h-8"
                title="Side-by-side comparison"
              >
                <Columns2 className="h-4 w-4" />
                <span className="hidden md:inline">Compare</span>
              </Button>
            </>
          )}
          <div className="w-px h-6 bg-border mx-2" />
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerate}
            disabled={isAnalyzing || isCompressing || !pendingImageData}
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : isCompressing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Compressing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Generate</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCodePanel(!showCodePanel)}
            className="gap-2 hidden lg:flex"
          >
            <Code2 className="h-4 w-4" />
            {showCodePanel ? "Hide" : "Show"} Code
          </Button>

          {/* History Controls */}
          <div className="w-px h-6 bg-border mx-2" />
          <HistoryPanel
            entries={history.entries}
            currentIndex={history.currentIndex}
            onSelectEntry={handleSelectHistoryEntry}
            onDeleteEntry={history.deleteEntry}
            onClearHistory={history.clearHistory}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
          />

          {/* Export Menu */}
          <ExportMenu code={generatedCode} disabled={!generatedCode} />

          {/* Keyboard Shortcuts */}
          <KeyboardShortcuts onShortcut={handleShortcut} />
        </div>

        {/* Style Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2">
            <Label htmlFor="style-select" className="text-sm whitespace-nowrap">Style:</Label>
            <Select value={styleGuide} onValueChange={setStyleGuide}>
              <SelectTrigger id="style-select" className="h-8 w-[140px] lg:w-[160px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Modern & Professional">Modern & Professional</SelectItem>
                <SelectItem value="Minimal & Clean">Minimal & Clean</SelectItem>
                <SelectItem value="Bold & Vibrant">Bold & Vibrant</SelectItem>
                <SelectItem value="Elegant & Luxury">Elegant & Luxury</SelectItem>
                <SelectItem value="Playful & Fun">Playful & Fun</SelectItem>
                <SelectItem value="Dark & Moody">Dark & Moody</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Color Palette</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(COLOR_PALETTES).map(([name, palette]) => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        onClick={() => setColorPalette(palette)}
                        className="justify-start gap-2"
                      >
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ background: palette.primary }} />
                          <div className="w-3 h-3 rounded-full" style={{ background: palette.secondary }} />
                          <div className="w-3 h-3 rounded-full" style={{ background: palette.accent }} />
                        </div>
                        <span className="text-xs">{name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Custom Colors</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(colorPalette).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="text-xs capitalize w-20">{key}:</Label>
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => setColorPalette(prev => ({ ...prev, [key]: e.target.value }))}
                          className="h-8 w-12 rounded border cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Sparkles className="h-4 w-4" />
                Custom Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Additional Instructions</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Textarea
                  id="custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Add a hero image, use rounded corners, include social media icons..."
                  className="min-h-[150px] text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Add any specific instructions for the AI to follow when generating your website
                </p>
              </div>
            </DialogContent>
          </Dialog>

          {generatedCode && !isAnalyzing && (
            <Badge variant="default" className="text-xs sm:text-sm px-2 sm:px-3 py-1 hidden sm:inline-flex">
              ✨ Ready
            </Badge>
          )}
          {imageSize > 0 && (
            <Badge variant="outline" className="text-xs hidden xl:inline-flex">
              {formatBytes(imageSize)}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs hidden xl:inline-flex">
            {rateLimiter.getRemainingRequests()}/5 requests
          </Badge>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden" id="main-content">
        {/* Canvas Area */}
        <div
          className="flex-1 relative"
          role="main"
          aria-label="Drawing canvas area"
        >
          {/* Excalidraw Canvas */}
          <div className="w-full h-full">
            <ExcalidrawWrapper
              onCapture={handleCapture}
            />
          </div>

          {/* Website Preview */}
          <div>
            {mode === "preview" && generatedCode && (
              <div className="absolute inset-0 bg-background z-10">
                {previewMode === "simple" && <SimplePreview code={generatedCode} />}
                {previewMode === "device" && <DevicePreview code={generatedCode} />}
                {previewMode === "comparison" && (
                  <ComparisonView code={generatedCode} sketchImage={pendingImageData} />
                )}
              </div>
            )}
            {mode === "preview" && !generatedCode && (
              <div className="absolute inset-0 bg-background/95 z-10 flex items-center justify-center p-4">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Draw something and click Generate to create your website
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Compression Indicator */}
          {isCompressing && (
            <div className="absolute top-4 left-4 bg-background/95 border rounded-lg px-4 py-2 flex items-center gap-2 z-20">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Optimizing image...</span>
            </div>
          )}
        </div>

        {/* Code Panel - Responsive */}
        {showCodePanel && (
          <div className="hidden lg:block w-[350px] xl:w-[450px] border-l bg-card overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Generated Code</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCodePanel(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
              {generatedCode ? (
                <CodeBlock code={generatedCode} />
              ) : (
                <div className="text-center py-12 space-y-2">
                  <Code2 className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Draw and generate to see code
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Code Panel - Full Screen Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden fixed bottom-4 right-4 z-20 gap-2 shadow-lg"
              disabled={!generatedCode}
            >
              <Code2 className="h-4 w-4" />
              View Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full h-full max-h-full m-0 p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>Generated Code</DialogTitle>
            </DialogHeader>
            <div className="p-4 overflow-y-auto">
              {generatedCode && <CodeBlock code={generatedCode} />}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

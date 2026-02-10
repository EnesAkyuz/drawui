"use client";

import dynamic from "next/dynamic";
import { Eye, Loader2, Pencil, Palette, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { CanvasMode } from "@/types/canvas";

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

export default function DrawingCanvas() {
  const [mode, setMode] = useState<CanvasMode>("drawing");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingImageData, setPendingImageData] = useState<string>("");
  const [styleGuide, setStyleGuide] = useState<string>("Modern & Professional");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [colorPalette, setColorPalette] = useState({
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899",
    background: "#ffffff",
    text: "#1f2937"
  });

  // Just capture the image data, don't auto-analyze
  const handleCapture = useCallback(
    (imageData: string, elementsHash: string) => {
      if (imageData) {
        setPendingImageData(imageData);
        console.log("📸 Canvas captured, ready to generate");
      }
    },
    [],
  );

  // Manual generation triggered by button
  const handleGenerate = useCallback(async () => {
    if (!pendingImageData) {
      console.log("No drawing to analyze");
      return;
    }

    const startTime = performance.now();
    setIsAnalyzing(true);

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

      if (!response.ok) {
        throw new Error("Failed to generate website");
      }

      const data = await response.json();
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`🎨 Website generated in ${duration}s`);
      console.log("Generated code:", data.code?.substring(0, 200));

      if (data.code) {
        setGeneratedCode(data.code);
        console.log("Code set, length:", data.code.length);
        setMode("preview"); // Auto-switch to preview
      }
    } catch (error) {
      console.error("Error generating website:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [pendingImageData, styleGuide, customPrompt, colorPalette]);

  const toggleMode = () => {
    setMode((prev) => (prev === "drawing" ? "preview" : "drawing"));
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Control Bar */}
      <div className="h-14 border-b bg-card px-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={mode === "drawing" ? "default" : "outline"}
            size="sm"
            onClick={toggleMode}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Drawing
          </Button>
          <Button
            variant={mode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={toggleMode}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerate}
            disabled={isAnalyzing || !pendingImageData}
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "✨ Generate Website"
            )}
          </Button>
        </div>

        {/* Style Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="style-select" className="text-sm whitespace-nowrap">Style:</Label>
            <Select value={styleGuide} onValueChange={setStyleGuide}>
              <SelectTrigger id="style-select" className="h-8 w-[160px] text-sm">
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
            <Badge variant="default" className="text-sm px-3 py-1">
              ✨ Ready to preview
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative">


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
                <SimplePreview code={generatedCode} />
              </div>
            )}
            {mode === "preview" && !generatedCode && (
              <div className="absolute inset-0 bg-background/95 z-10 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Draw something and wait for AI to generate your website
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Code Panel */}
        <div className="w-[400px] border-l bg-card p-4 overflow-y-auto">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Generated Code</h2>
            {generatedCode ? (
              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-[calc(100vh-100px)]">
                <code>{generatedCode}</code>
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Draw something to generate code
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

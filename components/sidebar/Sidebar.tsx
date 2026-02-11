"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Pencil,
  Code2,
  Columns2,
  History,
  Download,
  Palette,
  Settings,
  Keyboard,
  Loader2,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { ExportMenu } from "@/components/export/ExportMenu";
import { KeyboardShortcuts } from "@/components/accessibility/KeyboardShortcuts";
import type { GenerationHistoryEntry } from "@/types/history";

interface SidebarProps {
  // Mode
  mode: "drawing" | "preview";
  previewMode: "simple" | "device" | "comparison";
  onModeChange: (mode: "drawing" | "preview") => void;
  onPreviewModeChange: (mode: "simple" | "device" | "comparison") => void;

  // Generation
  isGenerating: boolean;
  isCompressing: boolean;
  canGenerate: boolean;
  onGenerate: () => void;

  // Code panel
  showCodePanel: boolean;
  onToggleCodePanel: () => void;
  hasCode: boolean;

  // Style & customization
  styleGuide: string;
  onStyleGuideChange: (style: string) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  onColorPaletteChange: (palette: any) => void;

  // History
  historyEntries: GenerationHistoryEntry[];
  currentHistoryIndex: number;
  onSelectHistoryEntry: (id: string) => void;
  onDeleteHistoryEntry: (id: string) => void;
  onClearHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Stats
  imageSize?: number;
  remainingRequests?: number;

  // Export
  generatedCode: string;

  // Shortcuts
  onShortcut?: (action: string) => void;
}

const COLOR_PALETTES = {
  "Ocean Blue": {
    primary: "#0ea5e9",
    secondary: "#0284c7",
    accent: "#06b6d4",
    background: "#f0f9ff",
    text: "#0c4a6e",
  },
  "Sunset Orange": {
    primary: "#f97316",
    secondary: "#ea580c",
    accent: "#fb923c",
    background: "#fff7ed",
    text: "#7c2d12",
  },
  "Forest Green": {
    primary: "#10b981",
    secondary: "#059669",
    accent: "#34d399",
    background: "#f0fdf4",
    text: "#064e3b",
  },
  "Purple Dream": {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    accent: "#a78bfa",
    background: "#faf5ff",
    text: "#581c87",
  },
  "Rose Pink": {
    primary: "#ec4899",
    secondary: "#db2777",
    accent: "#f472b6",
    background: "#fdf2f8",
    text: "#831843",
  },
  Monochrome: {
    primary: "#374151",
    secondary: "#1f2937",
    accent: "#6b7280",
    background: "#f9fafb",
    text: "#111827",
  },
  Vibrant: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899",
    background: "#ffffff",
    text: "#1f2937",
  },
} as const;

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="w-80 border-r bg-card flex flex-col">
      {/* Header */}
      <div className="h-14 border-b flex items-center px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-lg">DrawUI</h1>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <section>
            <Button
              variant="default"
              size="lg"
              className="w-full gap-2"
              onClick={props.onGenerate}
              disabled={
                props.isGenerating || props.isCompressing || !props.canGenerate
              }
            >
              {props.isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : props.isCompressing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Website
                </>
              )}
            </Button>
          </section>

          <Separator />

          {/* Mode Switcher */}
          <section>
            <h3 className="text-sm font-medium mb-3">View</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={props.mode === "drawing" ? "default" : "outline"}
                className="justify-start gap-2"
                onClick={() => props.onModeChange("drawing")}
              >
                <Pencil className="h-4 w-4" />
                Draw
              </Button>
              <Button
                variant={props.mode === "preview" ? "default" : "outline"}
                className="justify-start gap-2"
                onClick={() => props.onModeChange("preview")}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </div>

            {/* Preview Options */}
            {props.mode === "preview" && props.hasCode && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant={
                    props.previewMode === "simple" ? "secondary" : "ghost"
                  }
                  size="sm"
                  onClick={() => props.onPreviewModeChange("simple")}
                >
                  Simple
                </Button>
                <Button
                  variant={
                    props.previewMode === "comparison" ? "secondary" : "ghost"
                  }
                  size="sm"
                  onClick={() => props.onPreviewModeChange("comparison")}
                >
                  Compare
                </Button>
              </div>
            )}
          </section>

          <Separator />

          {/* Style Customization */}
          <section>
            <h3 className="text-sm font-medium mb-3">Style</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Theme</Label>
                <Select
                  value={props.styleGuide}
                  onValueChange={props.onStyleGuideChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Modern & Professional">
                      Modern & Professional
                    </SelectItem>
                    <SelectItem value="Minimal & Clean">
                      Minimal & Clean
                    </SelectItem>
                    <SelectItem value="Bold & Vibrant">
                      Bold & Vibrant
                    </SelectItem>
                    <SelectItem value="Elegant & Luxury">
                      Elegant & Luxury
                    </SelectItem>
                    <SelectItem value="Playful & Fun">Playful & Fun</SelectItem>
                    <SelectItem value="Dark & Moody">Dark & Moody</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Colors</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <div className="flex gap-1">
                        {Object.values(props.colorPalette)
                          .slice(0, 5)
                          .map((color, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                      </div>
                      <Palette className="h-4 w-4 ml-auto" />
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
                          {Object.entries(COLOR_PALETTES).map(
                            ([name, palette]) => (
                              <Button
                                key={name}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  props.onColorPaletteChange(palette)
                                }
                                className="justify-start gap-2"
                              >
                                <div className="flex gap-1">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: palette.primary }}
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: palette.secondary }}
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: palette.accent }}
                                  />
                                </div>
                                <span className="text-xs">{name}</span>
                              </Button>
                            ),
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Custom Colors</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(props.colorPalette).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2"
                              >
                                <Label className="text-xs capitalize w-20">
                                  {key}:
                                </Label>
                                <input
                                  type="color"
                                  value={value}
                                  onChange={(e) =>
                                    props.onColorPaletteChange({
                                      ...props.colorPalette,
                                      [key]: e.target.value,
                                    })
                                  }
                                  className="h-8 w-12 rounded border cursor-pointer"
                                />
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Instructions
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-2 px-3"
                    >
                      <span className="text-xs truncate text-left flex-1">
                        {props.customPrompt || "Add custom instructions..."}
                      </span>
                      <Sparkles className="h-3 w-3 ml-2 flex-shrink-0" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Custom Instructions</DialogTitle>
                      <DialogDescription>
                        Tell the AI what you want
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      value={props.customPrompt}
                      onChange={(e) =>
                        props.onCustomPromptChange(e.target.value)
                      }
                      placeholder="e.g., Add a hero image, use rounded corners, include social media icons..."
                      className="min-h-[150px]"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </section>

          <Separator />

          {/* History & Tools */}
          <section>
            <h3 className="text-sm font-medium mb-3">History</h3>
            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={props.onUndo}
                disabled={!props.canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={props.onRedo}
                disabled={!props.canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
            <HistoryPanel
              entries={props.historyEntries}
              currentIndex={props.currentHistoryIndex}
              onSelectEntry={props.onSelectHistoryEntry}
              onDeleteEntry={props.onDeleteHistoryEntry}
              onClearHistory={props.onClearHistory}
              onUndo={props.onUndo}
              onRedo={props.onRedo}
              canUndo={props.canUndo}
              canRedo={props.canRedo}
            />
          </section>

          <Separator />

          {/* Export & Tools */}
          <section>
            <h3 className="text-sm font-medium mb-3">Tools</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={props.onToggleCodePanel}
              >
                <Code2 className="h-4 w-4" />
                {props.showCodePanel ? "Hide Code" : "Show Code"}
              </Button>
              <ExportMenu
                code={props.generatedCode}
                disabled={!props.hasCode}
              />
              <KeyboardShortcuts onShortcut={props.onShortcut} />
            </div>
          </section>

          {/* Info */}
          {(props.imageSize || props.remainingRequests !== undefined) && (
            <>
              <Separator />
              <section>
                <div className="space-y-2 text-xs">
                  {props.imageSize && props.imageSize > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Image</span>
                      <span>{(props.imageSize / 1024).toFixed(0)} KB</span>
                    </div>
                  )}
                  {props.remainingRequests !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requests</span>
                      <span>{props.remainingRequests}/5</span>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

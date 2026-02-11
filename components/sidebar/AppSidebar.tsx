"use client";

import {
  Zap,
  Eye,
  Pencil,
  Loader2,
  Undo2,
  Redo2,
  Palette,
  Download,
  Keyboard,
  Wand2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { HistoryList } from "@/components/history/HistoryList";
import { ExportMenu } from "@/components/export/ExportMenu";
import { KeyboardShortcuts } from "@/components/accessibility/KeyboardShortcuts";
import type { GenerationHistoryEntry } from "@/types/history";

interface AppSidebarProps {
  mode: "drawing" | "preview";
  onModeChange: (mode: "drawing" | "preview") => void;
  isGenerating: boolean;
  isCompressing: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  hasCode: boolean;
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
  historyEntries: GenerationHistoryEntry[];
  currentHistoryIndex: number;
  onSelectHistoryEntry: (id: string) => void;
  onDeleteHistoryEntry: (id: string) => void;
  onClearHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  imageSize?: number;
  remainingRequests?: number;
  generatedCode: string;
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

export function AppSidebar(props: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=collapsed]:justify-center"
            >
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wand2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">DrawUI</span>
                  <span className="truncate text-xs text-muted-foreground">
                    AI Website Generator
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Generate Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  onClick={props.onGenerate}
                  disabled={
                    props.isGenerating ||
                    props.isCompressing ||
                    !props.canGenerate
                  }
                  tooltip={
                    props.isGenerating
                      ? "Generating..."
                      : props.isCompressing
                        ? "Compressing..."
                        : "Generate Website"
                  }
                  className="bg-primary text-primary-foreground hover:bg-primary/90 group-data-[collapsible=icon]:justify-center"
                >
                  {props.isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : props.isCompressing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  <span className="group-data-[collapsible=icon]:sr-only">
                    {props.isGenerating
                      ? "Generating..."
                      : props.isCompressing
                        ? "Compressing..."
                        : "Generate"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Mode Section */}
        <SidebarGroup>
          <SidebarGroupLabel>View</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={props.mode === "drawing"}
                  onClick={() => props.onModeChange("drawing")}
                  tooltip="Drawing Mode"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Draw</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={props.mode === "preview"}
                  onClick={() => props.onModeChange("preview")}
                  tooltip="Preview Mode"
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Customization */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Style</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-3 px-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Theme</Label>
              <Select
                value={props.styleGuide}
                onValueChange={props.onStyleGuideChange}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Modern & Professional">
                    Modern & Professional
                  </SelectItem>
                  <SelectItem value="Minimal & Clean">
                    Minimal & Clean
                  </SelectItem>
                  <SelectItem value="Bold & Vibrant">Bold & Vibrant</SelectItem>
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
                    size="sm"
                    className="w-full justify-start gap-2 h-9"
                  >
                    <div className="flex gap-1">
                      {Object.values(props.colorPalette)
                        .slice(0, 5)
                        .map((color, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-sm border"
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
                                {[
                                  palette.primary,
                                  palette.secondary,
                                  palette.accent,
                                ].map((c, i) => (
                                  <div
                                    key={i}
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: c }}
                                  />
                                ))}
                              </div>
                              <span className="text-xs">{name}</span>
                            </Button>
                          ),
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Custom</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(props.colorPalette).map(
                          ([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
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
                    size="sm"
                    className="w-full justify-start h-auto py-2 text-left"
                  >
                    <span className="text-xs truncate flex-1">
                      {props.customPrompt || "Add custom instructions..."}
                    </span>
                    <FileText className="h-3 w-3 ml-2 flex-shrink-0" />
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
                    onChange={(e) => props.onCustomPromptChange(e.target.value)}
                    placeholder="e.g., Add a hero image, use rounded corners..."
                    className="min-h-[150px]"
                  />
                </DialogContent>
              </Dialog>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* History */}
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={props.onUndo}
                  disabled={!props.canUndo}
                  tooltip="Undo (Ctrl+Z)"
                >
                  <Undo2 className="h-4 w-4" />
                  <span>Undo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={props.onRedo}
                  disabled={!props.canRedo}
                  tooltip="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="h-4 w-4" />
                  <span>Redo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="group-data-[collapsible=icon]:hidden mt-2">
              <HistoryList
                entries={props.historyEntries}
                currentIndex={props.currentHistoryIndex}
                onSelectEntry={props.onSelectHistoryEntry}
                onDeleteEntry={props.onDeleteHistoryEntry}
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                <ExportMenu
                  code={props.generatedCode}
                  disabled={!props.hasCode}
                />
              </SidebarMenuItem>
              <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                <KeyboardShortcuts onShortcut={props.onShortcut} />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Stats */}
        {(props.imageSize || props.remainingRequests !== undefined) && (
          <>
            <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupContent className="px-4">
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
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

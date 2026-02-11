"use client";

import { useEffect } from "react";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Shortcut {
  keys: string[];
  description: string;
  action?: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Ctrl", "Z"], description: "Undo last generation", action: "undo" },
  {
    keys: ["Ctrl", "Shift", "Z"],
    description: "Redo generation",
    action: "redo",
  },
  {
    keys: ["Ctrl", "Enter"],
    description: "Generate website",
    action: "generate",
  },
  {
    keys: ["Ctrl", "E"],
    description: "Toggle preview mode",
    action: "togglePreview",
  },
  {
    keys: ["Ctrl", "H"],
    description: "Toggle history panel",
    action: "toggleHistory",
  },
  {
    keys: ["Ctrl", "K"],
    description: "Toggle code panel",
    action: "toggleCode",
  },
  { keys: ["Ctrl", "S"], description: "Export code", action: "export" },
  { keys: ["?"], description: "Show keyboard shortcuts", action: "help" },
  { keys: ["Esc"], description: "Close dialogs", action: "close" },
];

interface KeyboardShortcutsProps {
  onShortcut?: (action: string) => void;
}

export function KeyboardShortcuts({ onShortcut }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // Help dialog
      if (e.key === "?") {
        e.preventDefault();
        onShortcut?.("help");
        return;
      }

      if (!ctrl) return;

      // Generate
      if (e.key === "Enter") {
        e.preventDefault();
        onShortcut?.("generate");
      }

      // Toggle preview
      if (e.key === "e") {
        e.preventDefault();
        onShortcut?.("togglePreview");
      }

      // Toggle history
      if (e.key === "h") {
        e.preventDefault();
        onShortcut?.("toggleHistory");
      }

      // Toggle code
      if (e.key === "k") {
        e.preventDefault();
        onShortcut?.("toggleCode");
      }

      // Export
      if (e.key === "s") {
        e.preventDefault();
        onShortcut?.("export");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onShortcut]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-8"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
          <span className="hidden xl:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

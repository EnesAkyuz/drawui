"use client";

import { History, Trash2, Clock, Undo2, Redo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GenerationHistoryEntry } from "@/types/history";
import { toast } from "sonner";

interface HistoryPanelProps {
  entries: GenerationHistoryEntry[];
  currentIndex: number;
  onSelectEntry: (id: string) => void;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function HistoryPanel({
  entries,
  currentIndex,
  onSelectEntry,
  onDeleteEntry,
  onClearHistory,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: HistoryPanelProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteEntry(id);
    toast.success("Generation deleted");
  };

  const handleClearAll = () => {
    onClearHistory();
    toast.success("History cleared");
  };

  return (
    <div className="flex items-center gap-2">
      {/* Undo/Redo buttons */}
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="gap-2 h-8"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
        <span className="hidden lg:inline">Undo</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        className="gap-2 h-8"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
        <span className="hidden lg:inline">Redo</span>
      </Button>

      {/* History panel */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <History className="h-4 w-4" />
            <span className="hidden lg:inline">History</span>
            {entries.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {entries.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Generation History</SheetTitle>
                <SheetDescription>
                  Browse and restore previous generations
                </SheetDescription>
              </div>
              {entries.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {entries.length} saved generations.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAll}>
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No generations yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first website to start building history
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...entries].reverse().map((entry, idx) => {
                  const actualIndex = entries.length - 1 - idx;
                  const isActive = actualIndex === currentIndex;

                  return (
                    <div
                      key={entry.id}
                      className={`group relative border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                        isActive ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:border-primary/50'
                      }`}
                      onClick={() => onSelectEntry(entry.id)}
                    >
                      {isActive && (
                        <Badge className="absolute -top-2 -right-2 text-xs">
                          Current
                        </Badge>
                      )}

                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded border bg-muted flex-shrink-0 overflow-hidden">
                          <img
                            src={entry.thumbnail}
                            alt="Generation thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {entry.styleGuide}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(entry.timestamp)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleDelete(entry.id, e)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {entry.customPrompt && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {entry.customPrompt}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 pt-1">
                            <Badge variant="outline" className="text-xs h-5">
                              {entry.generationTime.toFixed(1)}s
                            </Badge>
                            <div className="flex gap-0.5">
                              {Object.entries(entry.colorPalette).slice(0, 3).map(([key, color]) => (
                                <div
                                  key={key}
                                  className="w-4 h-5 rounded-sm border"
                                  style={{ backgroundColor: color }}
                                  title={`${key}: ${color}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

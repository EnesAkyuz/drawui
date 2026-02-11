"use client";

import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GenerationHistoryEntry } from "@/types/history";
import { toast } from "sonner";

interface HistoryListProps {
  entries: GenerationHistoryEntry[];
  currentIndex: number;
  onSelectEntry: (id: string) => void;
  onDeleteEntry: (id: string) => void;
}

export function HistoryList({
  entries,
  currentIndex,
  onSelectEntry,
  onDeleteEntry,
}: HistoryListProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
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

  if (entries.length === 0) {
    return (
      <div className="px-2 py-8 text-center">
        <p className="text-xs text-muted-foreground">No history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-2 max-h-[300px] overflow-y-auto">
      {[...entries].reverse().map((entry, idx) => {
        const actualIndex = entries.length - 1 - idx;
        const isActive = actualIndex === currentIndex;

        return (
          <div
            key={entry.id}
            className={`group relative border rounded-lg p-2 cursor-pointer transition-all hover:shadow-sm ${
              isActive
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "hover:border-primary/50"
            }`}
            onClick={() => onSelectEntry(entry.id)}
          >
            {isActive && (
              <Badge
                variant="secondary"
                className="absolute -top-1.5 -right-1.5 text-[10px] h-4 px-1.5"
              >
                Current
              </Badge>
            )}

            <div className="flex gap-2">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded border bg-muted flex-shrink-0 overflow-hidden">
                <img
                  src={entry.thumbnail}
                  alt="Generation"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-medium truncate">
                    {entry.styleGuide}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(entry.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {formatTime(entry.timestamp)}
                </div>

                <div className="flex gap-1">
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    {entry.generationTime.toFixed(1)}s
                  </Badge>
                  <div className="flex gap-0.5">
                    {Object.values(entry.colorPalette)
                      .slice(0, 3)
                      .map((color, i) => (
                        <div
                          key={i}
                          className="w-3 h-4 rounded-sm border"
                          style={{ backgroundColor: color }}
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
  );
}

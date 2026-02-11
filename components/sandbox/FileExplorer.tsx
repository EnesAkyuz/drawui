"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Plus,
  Trash2,
  FileCode,
  FileJson,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  permissions?: string;
  size?: string;
}

interface FileTreeNodeProps {
  item: FileItem;
  level: number;
  sandboxId: string;
  onFileSelect: (path: string, content: string) => void;
  selectedPath?: string;
}

function getFileIcon(name: string) {
  if (
    name.endsWith(".tsx") ||
    name.endsWith(".ts") ||
    name.endsWith(".jsx") ||
    name.endsWith(".js")
  ) {
    return <FileCode className="h-4 w-4 text-blue-400" />;
  }
  if (name.endsWith(".json")) {
    return <FileJson className="h-4 w-4 text-yellow-400" />;
  }
  if (name.endsWith(".css") || name.endsWith(".scss")) {
    return <FileCode className="h-4 w-4 text-pink-400" />;
  }
  if (name.endsWith(".md")) {
    return <FileText className="h-4 w-4 text-slate-400" />;
  }
  return <File className="h-4 w-4 text-slate-400" />;
}

function FileTreeNode({
  item,
  level,
  sandboxId,
  onFileSelect,
  selectedPath,
}: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [children, setChildren] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadChildren = useCallback(async () => {
    if (!item.isDirectory || hasLoaded) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/sandbox-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId, path: item.path, action: "list" }),
      });
      const data = await response.json();
      if (data.items) {
        // Sort: directories first, then files, alphabetically
        const sorted = data.items.sort((a: FileItem, b: FileItem) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
        setChildren(sorted);
      }
      setHasLoaded(true);
    } catch (error) {
      console.error("Failed to load children:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId, item.path, item.isDirectory, hasLoaded]);

  useEffect(() => {
    if (isExpanded && !hasLoaded) {
      loadChildren();
    }
  }, [isExpanded, hasLoaded, loadChildren]);

  const handleClick = async () => {
    if (item.isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      // Load file content
      try {
        const response = await fetch("/api/sandbox-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sandboxId, path: item.path, action: "read" }),
        });
        const data = await response.json();
        if (data.content !== undefined) {
          onFileSelect(item.path, data.content);
        }
      } catch (error) {
        console.error("Failed to read file:", error);
      }
    }
  };

  // Skip node_modules and .next
  if (
    item.name === "node_modules" ||
    item.name === ".next" ||
    item.name === ".git"
  ) {
    return null;
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded cursor-pointer hover:bg-slate-800 text-sm",
          selectedPath === item.path && "bg-slate-700",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {item.isDirectory ? (
          <>
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
            ) : isExpanded ? (
              <ChevronDown className="h-3 w-3 text-slate-400" />
            ) : (
              <ChevronRight className="h-3 w-3 text-slate-400" />
            )}
            <Folder className="h-4 w-4 text-amber-400" />
          </>
        ) : (
          <>
            <span className="w-3" />
            {getFileIcon(item.name)}
          </>
        )}
        <span className="ml-1 text-slate-300 truncate">{item.name}</span>
      </div>

      {item.isDirectory && isExpanded && (
        <div>
          {children.map((child) => (
            <FileTreeNode
              key={child.path}
              item={child}
              level={level + 1}
              sandboxId={sandboxId}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileExplorerProps {
  sandboxId: string;
  onFileSelect: (path: string, content: string) => void;
  selectedPath?: string;
}

export function FileExplorer({
  sandboxId,
  onFileSelect,
  selectedPath,
}: FileExplorerProps) {
  const [rootItems, setRootItems] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRoot = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sandbox-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sandboxId,
          path: "/home/user/app",
          action: "list",
        }),
      });
      const data = await response.json();
      if (data.items) {
        const sorted = data.items.sort((a: FileItem, b: FileItem) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
        setRootItems(sorted);
      }
    } catch (error) {
      console.error("Failed to load root:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId]);

  useEffect(() => {
    if (sandboxId) {
      loadRoot();
    }
  }, [sandboxId, loadRoot]);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase">
          Files
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadRoot}
          className="h-6 w-6 p-0 text-slate-400 hover:text-white"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : rootItems.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No files found
            </div>
          ) : (
            rootItems.map((item) => (
              <FileTreeNode
                key={item.path}
                item={item}
                level={0}
                sandboxId={sandboxId}
                onFileSelect={onFileSelect}
                selectedPath={selectedPath}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  ExternalLink,
  RefreshCw,
  Eye,
  Terminal,
  Play,
  PanelLeftClose,
  PanelLeft,
  Code,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileExplorer } from "@/components/sandbox/FileExplorer";
import { cn } from "@/lib/utils";

interface E2BPreviewProps {
  sandboxUrl: string | null;
  sandboxId?: string;
  isLoading?: boolean;
  logs?: string[];
  onRunCommand?: (
    command: string,
  ) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

export function E2BPreview({
  sandboxUrl,
  sandboxId,
  isLoading = false,
  logs = [],
  onRunCommand,
}: E2BPreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "terminal" | "code">(
    "preview",
  );
  const [showFileExplorer, setShowFileExplorer] = useState(true);

  // Preview state
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Code editor state
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [currentFileContent, setCurrentFileContent] = useState<string>("");
  const [editableCode, setEditableCode] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<
    Array<{ type: "input" | "output" | "error"; text: string }>
  >([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const handleRefresh = useCallback(() => {
    setIframeKey((prev) => prev + 1);
    setIframeLoaded(false);
  }, []);

  // Load file content
  const handleFileSelect = useCallback(
    async (filePath: string) => {
      if (!sandboxId) return;

      setCurrentFilePath(filePath);
      setIsLoadingFile(true);
      setActiveTab("code");

      try {
        const response = await fetch("/api/sandbox-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sandboxId,
            action: "read",
            path: filePath,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentFileContent(data.content || "");
          setEditableCode(data.content || "");
          setHasUnsavedChanges(false);
        } else {
          setCurrentFileContent("// Error loading file");
          setEditableCode("// Error loading file");
        }
      } catch {
        setCurrentFileContent("// Error loading file");
        setEditableCode("// Error loading file");
      } finally {
        setIsLoadingFile(false);
      }
    },
    [sandboxId],
  );

  // Save file content
  const handleSaveFile = useCallback(async () => {
    if (!sandboxId || !currentFilePath || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/sandbox-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sandboxId,
          action: "write",
          path: currentFilePath,
          content: editableCode,
        }),
      });

      if (response.ok) {
        setCurrentFileContent(editableCode);
        setHasUnsavedChanges(false);
        // Refresh preview after save
        handleRefresh();
      }
    } finally {
      setIsSaving(false);
    }
  }, [sandboxId, currentFilePath, editableCode, isSaving, handleRefresh]);

  // Track unsaved changes
  const handleCodeChange = useCallback(
    (value: string) => {
      setEditableCode(value);
      setHasUnsavedChanges(value !== currentFileContent);
    },
    [currentFileContent],
  );

  const handleRunCommand = async () => {
    if (!terminalInput.trim() || !onRunCommand || isRunningCommand) return;

    const cmd = terminalInput.trim();
    setTerminalInput("");
    setTerminalHistory((prev) => [
      ...prev,
      { type: "input", text: `$ ${cmd}` },
    ]);
    setIsRunningCommand(true);

    try {
      const result = await onRunCommand(cmd);
      if (result.stdout) {
        setTerminalHistory((prev) => [
          ...prev,
          { type: "output", text: result.stdout },
        ]);
      }
      if (result.stderr) {
        setTerminalHistory((prev) => [
          ...prev,
          { type: "error", text: result.stderr },
        ]);
      }
      if (result.exitCode !== 0) {
        setTerminalHistory((prev) => [
          ...prev,
          { type: "error", text: `Exit code: ${result.exitCode}` },
        ]);
      }
    } catch (error) {
      setTerminalHistory((prev) => [
        ...prev,
        { type: "error", text: `Error: ${error}` },
      ]);
    } finally {
      setIsRunningCommand(false);
    }
  };

  return (
    <div className="w-full h-full flex bg-slate-950 rounded-lg overflow-hidden">
      {/* File Explorer Sidebar */}
      {sandboxId && showFileExplorer && (
        <div className="w-56 flex-shrink-0 border-r border-slate-800">
          <FileExplorer sandboxId={sandboxId} onFileSelect={handleFileSelect} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            {sandboxId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileExplorer(!showFileExplorer)}
                className="h-7 w-7 p-0 text-slate-400 hover:text-white flex-shrink-0"
              >
                {showFileExplorer ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
            )}
            <div className="flex gap-1.5 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-slate-400 font-mono truncate">
              {sandboxUrl ? new URL(sandboxUrl).hostname : "e2b sandbox"}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {sandboxUrl && activeTab === "preview" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(sandboxUrl, "_blank")}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/50 border-b border-slate-800">
          <Button
            variant={activeTab === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("preview")}
            className="h-7 px-3 text-xs"
            disabled={!sandboxUrl && !isLoading}
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button
            variant={activeTab === "terminal" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("terminal")}
            className="h-7 px-3 text-xs"
            disabled={!sandboxId}
          >
            <Terminal className="h-3 w-3 mr-1" />
            Terminal
          </Button>
          <Button
            variant={activeTab === "code" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("code")}
            className="h-7 px-3 text-xs"
            disabled={!currentFilePath}
          >
            <Code className="h-3 w-3 mr-1" />
            Code
            {hasUnsavedChanges && (
              <span className="ml-1 text-yellow-400">●</span>
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {/* Preview Tab */}
          {activeTab === "preview" && (
            <div className="absolute inset-0">
              {/* Loading/Logs overlay */}
              {(isLoading || logs.length > 0) && (
                <div
                  className={cn(
                    "absolute inset-0 z-10 bg-slate-950 p-4 overflow-auto transition-opacity duration-300",
                    sandboxUrl && iframeLoaded && !isLoading
                      ? "opacity-0 pointer-events-none"
                      : "opacity-100",
                  )}
                >
                  <div className="font-mono text-xs space-y-1">
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className={cn(
                          log.includes("✅") && "text-green-400",
                          log.includes("❌") && "text-red-400",
                          log.includes("⚠️") && "text-yellow-400",
                          log.includes("📦") && "text-blue-400",
                          log.includes("🚀") && "text-purple-400",
                          log.includes("🔨") && "text-orange-400",
                          log.includes("📝") && "text-cyan-400",
                          log.includes("🤖") && "text-purple-400",
                          !log.match(/[✅❌⚠️📦🚀🔨📝🤖]/) && "text-slate-300",
                        )}
                      >
                        {log}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-slate-400 mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Iframe */}
              {sandboxUrl && (
                <iframe
                  key={iframeKey}
                  src={sandboxUrl}
                  title="E2B Sandbox Preview"
                  className="w-full h-full border-0"
                  onLoad={() => setIframeLoaded(true)}
                  allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi"
                  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                />
              )}

              {/* Empty state */}
              {!sandboxUrl && !isLoading && logs.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎨</div>
                    <p>Draw something and click Generate</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Your component will appear here in a live sandbox
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terminal Tab */}
          {activeTab === "terminal" && (
            <div className="absolute inset-0 flex flex-col bg-black">
              <div
                ref={terminalRef}
                className="flex-1 p-3 overflow-auto font-mono text-xs"
              >
                {terminalHistory.length === 0 && (
                  <div className="text-slate-500">
                    Terminal ready. Run commands in your sandbox.
                    <br />
                    <span className="text-slate-600">
                      Working directory: /home/user/app
                    </span>
                  </div>
                )}
                {terminalHistory.map((entry, i) => (
                  <div
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap",
                      entry.type === "input" && "text-cyan-400",
                      entry.type === "error" && "text-red-400",
                      entry.type === "output" && "text-slate-300",
                    )}
                  >
                    {entry.text}
                  </div>
                ))}
                {isRunningCommand && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Running...
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-2 border-t border-slate-800 bg-slate-900">
                <span className="text-cyan-400 font-mono text-sm">$</span>
                <Input
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunCommand()}
                  placeholder="Enter command..."
                  className="flex-1 h-8 font-mono text-xs bg-black border-slate-700 text-slate-300"
                  disabled={isRunningCommand || !onRunCommand}
                />
                <Button
                  size="sm"
                  onClick={handleRunCommand}
                  disabled={
                    isRunningCommand || !terminalInput.trim() || !onRunCommand
                  }
                  className="h-8"
                >
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Code Tab */}
          {activeTab === "code" && (
            <div className="absolute inset-0 flex flex-col bg-slate-950">
              {/* Code header */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <Code className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300 font-mono truncate">
                    {currentFilePath || "No file selected"}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="text-xs text-yellow-400">●</span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveFile}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="h-7 px-3 text-xs"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  Save
                </Button>
              </div>

              {/* Code editor */}
              <div className="flex-1 overflow-hidden">
                {isLoadingFile ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : currentFilePath ? (
                  <Textarea
                    value={editableCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="w-full h-full resize-none font-mono text-xs bg-slate-950 border-0 rounded-none focus-visible:ring-0 text-slate-300"
                    placeholder="Select a file from the explorer to edit..."
                    spellCheck={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <div className="text-center">
                      <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select a file from the explorer</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

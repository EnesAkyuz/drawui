"use client";

import { Download, Code, Globe, Package, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportToCodeSandbox,
  exportToStackBlitz,
  exportAsHTML,
  exportAsProject,
} from "@/lib/export-utils";

interface ExportMenuProps {
  code: string;
  disabled?: boolean;
}

export function ExportMenu({ code, disabled }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-8"
          disabled={disabled}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => exportToCodeSandbox({ code })}
          className="gap-2"
        >
          <Code className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">CodeSandbox</div>
            <div className="text-xs text-muted-foreground">
              Open in online editor
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => exportToStackBlitz({ code })}
          className="gap-2"
        >
          <FileCode className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">StackBlitz</div>
            <div className="text-xs text-muted-foreground">
              Instant dev environment
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => exportAsHTML({ code })}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Standalone HTML</div>
            <div className="text-xs text-muted-foreground">
              Single file with CDN links
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => exportAsProject({ code })}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Complete Project</div>
            <div className="text-xs text-muted-foreground">
              Full Vite + React setup
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

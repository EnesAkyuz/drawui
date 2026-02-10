"use client";

import { toPng, toSvg } from "html-to-image";
import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GeneratedComponent } from "@/types/canvas";
import CodeGenerator from "./CodeGenerator";

interface ExportPanelProps {
  components: GeneratedComponent[];
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export default function ExportPanel({
  components,
  previewRef,
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportImage = async (format: "png" | "svg") => {
    if (!previewRef.current) return;

    setIsExporting(true);

    try {
      const dataUrl =
        format === "png"
          ? await toPng(previewRef.current, { quality: 1.0 })
          : await toSvg(previewRef.current);

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `generated-ui.${format}`;
      a.click();
    } catch (error) {
      console.error("Failed to export image:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="p-4">
      <Tabs defaultValue="code">
        <TabsList className="w-full">
          <TabsTrigger value="code" className="flex-1">
            Code
          </TabsTrigger>
          <TabsTrigger value="image" className="flex-1">
            Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-4">
          <CodeGenerator components={components} />
        </TabsContent>

        <TabsContent value="image" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => handleExportImage("png")}
              disabled={isExporting || components.length === 0}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Export PNG
            </Button>
            <Button
              onClick={() => handleExportImage("svg")}
              disabled={isExporting || components.length === 0}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Export SVG
            </Button>
          </div>
          {components.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Generate components first to export images
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

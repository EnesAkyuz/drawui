"use client";

import { useState, memo } from "react";
import { Monitor, Smartphone, Tablet, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import SimplePreview from "../canvas/SimplePreview";

type DeviceType = "mobile" | "tablet" | "desktop" | "fullscreen";

interface DeviceConfig {
  width: string;
  height: string;
  icon: typeof Smartphone;
  label: string;
}

const DEVICE_CONFIGS: Record<Exclude<DeviceType, "fullscreen">, DeviceConfig> = {
  mobile: {
    width: "375px",
    height: "667px",
    icon: Smartphone,
    label: "Mobile",
  },
  tablet: {
    width: "768px",
    height: "1024px",
    icon: Tablet,
    label: "Tablet",
  },
  desktop: {
    width: "1440px",
    height: "900px",
    icon: Monitor,
    label: "Desktop",
  },
};

interface DevicePreviewProps {
  code: string;
}

export const DevicePreview = memo(function DevicePreview({ code }: DevicePreviewProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");

  const config = device !== "fullscreen" ? DEVICE_CONFIGS[device] : null;

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Device Selector */}
      <div className="flex items-center justify-center gap-4 p-4 border-b bg-background/95 backdrop-blur">
        <ToggleGroup
          type="single"
          value={device}
          onValueChange={(value) => value && setDevice(value as DeviceType)}
          className="gap-1"
        >
          {Object.entries(DEVICE_CONFIGS).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <ToggleGroupItem
                key={key}
                value={key}
                aria-label={config.label}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </ToggleGroupItem>
            );
          })}
          <ToggleGroupItem value="fullscreen" aria-label="Fullscreen" className="gap-2">
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Full</span>
          </ToggleGroupItem>
        </ToggleGroup>

        {config && (
          <div className="text-xs text-muted-foreground hidden md:block">
            {config.width} × {config.height}
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {device === "fullscreen" ? (
          <div className="w-full h-full">
            <SimplePreview code={code} />
          </div>
        ) : config ? (
          <div
            className="bg-background border rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{
              width: config.width,
              height: config.height,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <SimplePreview code={code} />
          </div>
        ) : null}
      </div>
    </div>
  );
});

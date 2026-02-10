export type CanvasMode = "drawing" | "preview";

export interface ComponentPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GeneratedComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  position: ComponentPosition;
  sourceDrawingHash: string;
  timestamp: number;
}

export interface GeminiComponentResponse {
  type: string;
  position: ComponentPosition;
  props: Record<string, any>;
}

export interface AnalyzeDrawingRequest {
  image: string; // base64
  availableComponents: string[];
}

export interface AnalyzeDrawingResponse {
  components: GeminiComponentResponse[];
  error?: string;
}

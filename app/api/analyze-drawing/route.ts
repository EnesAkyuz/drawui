import { type NextRequest, NextResponse } from "next/server";
import { getInstalledComponents } from "@/lib/component-registry";
import { analyzeDrawing } from "@/lib/gemini";
import type {
  AnalyzeDrawingRequest,
  AnalyzeDrawingResponse,
} from "@/types/canvas";

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeDrawingRequest = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 },
      );
    }

    // Get available components
    const availableComponents =
      body.availableComponents || getInstalledComponents();

    if (availableComponents.length === 0) {
      return NextResponse.json(
        { error: "No components available" },
        { status: 500 },
      );
    }

    // Analyze drawing with Gemini
    const components = await analyzeDrawing(body.image, availableComponents);

    const response: AnalyzeDrawingResponse = {
      components,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error analyzing drawing:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to analyze drawing: ${errorMessage}` },
      { status: 500 },
    );
  }
}

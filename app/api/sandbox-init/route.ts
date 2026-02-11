import { NextResponse } from "next/server";
import { prewarmSandbox, getPrewarmedSandbox } from "@/lib/e2b-sandbox";

export async function POST() {
  // Check if already pre-warmed
  const existing = getPrewarmedSandbox();
  if (existing) {
    return NextResponse.json({
      success: true,
      sandboxId: existing.sandbox.sandboxId,
      url: existing.url,
      cached: true,
    });
  }

  const logs: string[] = [];

  const result = await prewarmSandbox((log) => {
    logs.push(log);
    console.log("[prewarm]", log);
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error, logs },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    sandboxId: result.sandboxId,
    url: result.url,
    cached: false,
    logs,
  });
}

export async function GET() {
  const existing = getPrewarmedSandbox();
  if (!existing) {
    return NextResponse.json({ ready: false });
  }

  return NextResponse.json({
    ready: true,
    sandboxId: existing.sandbox.sandboxId,
    url: existing.url,
    isReady: existing.isReady,
    isDevServerRunning: existing.isDevServerRunning,
  });
}

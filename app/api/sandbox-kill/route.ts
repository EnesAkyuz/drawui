import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  closeSandbox,
  clearPrewarmedSandbox,
  getPrewarmedSandbox,
} from "@/lib/e2b-sandbox";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sandboxId } = body;

    // If specific sandbox ID provided, kill that one
    if (sandboxId) {
      await closeSandbox(sandboxId);
      return NextResponse.json({ success: true, killed: sandboxId });
    }

    // Otherwise kill the pre-warmed sandbox
    const prewarmed = getPrewarmedSandbox();
    if (prewarmed) {
      const id = prewarmed.sandbox.sandboxId;
      clearPrewarmedSandbox();
      await closeSandbox(id);
      return NextResponse.json({ success: true, killed: id });
    }

    return NextResponse.json({ success: true, killed: null });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 },
    );
  }
}

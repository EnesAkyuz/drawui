import { NextRequest, NextResponse } from "next/server";
import { updateComponentInSandbox } from "@/lib/e2b-sandbox";

export async function POST(request: NextRequest) {
  try {
    const { sandboxId, code } = await request.json();

    if (!sandboxId) {
      return NextResponse.json(
        { error: "Sandbox ID is required" },
        { status: 400 },
      );
    }

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const logs: string[] = [];
    const result = await updateComponentInSandbox(sandboxId, code, (log) =>
      logs.push(log),
    );

    return NextResponse.json({
      success: result.success,
      errors: result.errors,
      logs,
      url: result.url,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errMsg, success: false },
      { status: 500 },
    );
  }
}

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Sandbox } from "e2b";

export async function POST(request: NextRequest) {
  try {
    const { sandboxId, command } = await request.json();

    if (!sandboxId) {
      return NextResponse.json(
        { error: "Sandbox ID is required" },
        { status: 400 },
      );
    }

    if (!command) {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 },
      );
    }

    // Connect to existing sandbox by ID
    let sandbox: Sandbox;
    try {
      sandbox = await Sandbox.connect(sandboxId, {
        apiKey: process.env.E2B_API_KEY,
      });
    } catch {
      return NextResponse.json(
        { error: "Sandbox session not found or expired" },
        { status: 404 },
      );
    }

    const result = await sandbox.commands.run(command, {
      cwd: "/home/user/app",
      timeoutMs: 60000, // 1 minute timeout
    });

    return NextResponse.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

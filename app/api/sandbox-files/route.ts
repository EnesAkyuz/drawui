import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Sandbox } from "e2b";

export async function POST(request: NextRequest) {
  try {
    const { sandboxId, path, action, content, newPath } = await request.json();

    if (!sandboxId) {
      return NextResponse.json(
        { error: "Sandbox ID is required" },
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

    switch (action) {
      case "list": {
        // List directory contents
        const targetPath = path || "/home/user/app";
        const result = await sandbox.commands.run(`ls -la "${targetPath}"`, {
          cwd: "/home/user/app",
        });

        // Parse ls output into structured data
        const lines = result.stdout
          .split("\n")
          .filter((l) => l && !l.startsWith("total"));
        const items = lines
          .map((line) => {
            const parts = line.split(/\s+/);
            const permissions = parts[0];
            const name = parts.slice(8).join(" ");
            const isDirectory = permissions.startsWith("d");
            return {
              name,
              path: `${targetPath}/${name}`.replace("//", "/"),
              isDirectory,
              permissions,
              size: parts[4],
            };
          })
          .filter(
            (item) => item.name && item.name !== "." && item.name !== "..",
          );

        return NextResponse.json({ items });
      }

      case "read": {
        // Read file content
        if (!path) {
          return NextResponse.json(
            { error: "Path is required" },
            { status: 400 },
          );
        }
        const fileContent = await sandbox.files.read(path);
        return NextResponse.json({ content: fileContent });
      }

      case "write": {
        // Write file content
        if (!path || content === undefined) {
          return NextResponse.json(
            { error: "Path and content are required" },
            { status: 400 },
          );
        }
        await sandbox.files.write(path, content);
        return NextResponse.json({ success: true });
      }

      case "mkdir": {
        // Create directory
        if (!path) {
          return NextResponse.json(
            { error: "Path is required" },
            { status: 400 },
          );
        }
        await sandbox.commands.run(`mkdir -p "${path}"`);
        return NextResponse.json({ success: true });
      }

      case "delete": {
        // Delete file or directory
        if (!path) {
          return NextResponse.json(
            { error: "Path is required" },
            { status: 400 },
          );
        }
        await sandbox.commands.run(`rm -rf "${path}"`);
        return NextResponse.json({ success: true });
      }

      case "rename": {
        // Rename/move file
        if (!path || !newPath) {
          return NextResponse.json(
            { error: "Path and newPath are required" },
            { status: 400 },
          );
        }
        await sandbox.commands.run(`mv "${path}" "${newPath}"`);
        return NextResponse.json({ success: true });
      }

      case "tree": {
        // Get full directory tree
        const targetPath = path || "/home/user/app";
        const result = await sandbox.commands.run(
          `find "${targetPath}" -type f -o -type d | head -200`,
          { cwd: "/home/user/app" },
        );
        const paths = result.stdout.split("\n").filter(Boolean);
        return NextResponse.json({ paths });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

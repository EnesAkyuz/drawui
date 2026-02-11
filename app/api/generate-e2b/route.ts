import type { NextRequest } from "next/server";
import { Sandbox } from "e2b";
import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
  type Part,
} from "@google/generative-ai";
import { createWebsitePrompt } from "@/lib/gemini";

const tools: FunctionDeclaration[] = [
  {
    name: "read_file",
    description: "Read the contents of a file in the sandbox",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        path: {
          type: SchemaType.STRING,
          description: "The absolute path to the file to read",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file in the sandbox",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        path: {
          type: SchemaType.STRING,
          description: "The absolute path to the file to write",
        },
        content: {
          type: SchemaType.STRING,
          description: "The content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "run_command",
    description: "Run a shell command in the sandbox",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        command: {
          type: SchemaType.STRING,
          description: "The command to run",
        },
        cwd: {
          type: SchemaType.STRING,
          description: "The working directory (default: /home/user/app)",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "list_files",
    description: "List files in a directory",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        path: {
          type: SchemaType.STRING,
          description: "The directory path to list",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "task_complete",
    description: "Call when the component builds successfully",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        success: {
          type: SchemaType.BOOLEAN,
          description: "Whether the task was successful",
        },
        message: {
          type: SchemaType.STRING,
          description: "A message describing the result",
        },
      },
      required: ["success"],
    },
  },
];

function extractCodeFromResponse(text: string): string | null {
  const codeMatch = text.match(
    /```(?:tsx|typescript|jsx|javascript)?\s*([\s\S]*?)```/,
  );
  if (!codeMatch) return null;
  return codeMatch[1].trim();
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.image) {
    return new Response(JSON.stringify({ error: "Image data is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existingSandboxId: string | undefined = body.sandboxId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const log = (msg: string) => sendEvent("log", { message: msg });

      try {
        log("🎨 Generating component from your drawing...");

        const genAI = new GoogleGenerativeAI(
          process.env.GOOGLE_GEMINI_API_KEY || "",
        );

        const generationModel = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
          generationConfig: { temperature: 0.7, topP: 0.95, topK: 64 },
        });

        const agentModel = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
          generationConfig: { temperature: 0.3 },
          tools: [{ functionDeclarations: tools }],
        });

        const prompt = createWebsitePrompt(
          body.styleGuide,
          body.customPrompt,
          body.colorPalette,
        );

        const mimeType = body.image.startsWith("data:image/jpeg")
          ? "image/jpeg"
          : "image/png";

        const imagePart: Part = {
          inlineData: {
            data: body.image.split(",")[1],
            mimeType,
          },
        };

        const result = await generationModel.generateContent([
          prompt,
          imagePart,
        ]);
        const text = result.response.text();
        const generatedCode = extractCodeFromResponse(text);

        if (!generatedCode) {
          throw new Error("Failed to extract code from AI response");
        }

        log("✅ Initial code generated");
        sendEvent("code", { code: generatedCode });

        let sandbox: Sandbox;
        let sandboxUrl: string;

        if (existingSandboxId) {
          log("📝 Connecting to existing sandbox...");
          try {
            sandbox = await Sandbox.connect(existingSandboxId, {
              apiKey: process.env.E2B_API_KEY,
            });
            const host = sandbox.getHost(3000);
            sandboxUrl = `https://${host}`;
            log("✅ Connected to sandbox");
          } catch {
            log("⚠️ Could not connect, creating new sandbox...");
            sandbox = await Sandbox.create("nextjs-shadcn", {
              apiKey: process.env.E2B_API_KEY,
              timeoutMs: 600000,
            });
            sandboxUrl = await setupNewSandbox(sandbox, log);
          }
        } else {
          log("🚀 Creating new sandbox...");
          sandbox = await Sandbox.create("nextjs-shadcn", {
            apiKey: process.env.E2B_API_KEY,
            timeoutMs: 600000,
          });
          sandboxUrl = await setupNewSandbox(sandbox, log);
        }

        log("📝 Writing component...");
        await sandbox.files.write(
          "/home/user/app/app/component.tsx",
          generatedCode,
        );

        const pageContent = `import Component from "./component";
export default function Page() {
  return <Component />;
}`;
        await sandbox.files.write("/home/user/app/app/page.tsx", pageContent);

        const shadcnComponents = detectShadcnImports(generatedCode);
        if (shadcnComponents.length > 0) {
          log(`📦 Installing shadcn: ${shadcnComponents.join(", ")}...`);
          for (const comp of shadcnComponents) {
            await sandbox.commands.run(`npx shadcn@latest add ${comp} --yes`, {
              cwd: "/home/user/app",
              timeoutMs: 120000,
            });
          }
        }

        log("🔨 Checking build...");
        const buildResult = await sandbox.commands.run("npm run build 2>&1", {
          cwd: "/home/user/app",
          timeoutMs: 120000,
        });

        let currentCode = generatedCode;

        if (buildResult.exitCode !== 0) {
          const buildErrors = buildResult.stdout + buildResult.stderr;
          log("⚠️ Build errors detected, starting autonomous fix agent...");

          const agentSystemPrompt = `You are an expert React/Next.js developer with FULL ACCESS to a sandbox environment. Your job is to fix build errors.

YOUR MISSION:
1. The component at /home/user/app/app/component.tsx has build errors
2. You have FULL AUTONOMOUS ACCESS to fix them
3. Keep the visual design EXACTLY the same - only fix syntax errors

TOOLS YOU HAVE:
- read_file(path): Read any file
- write_file(path, content): Write any file
- run_command(command): Run any shell command
- list_files(path): List directory contents  
- task_complete(success, message): Call when build succeeds

WORKFLOW:
1. Read the component to understand the code structure
2. Identify syntax errors from the build output
3. Fix the code and write it back
4. Run "npm run build" to verify
5. If still errors, read and fix again
6. When build succeeds (exit code 0), call task_complete(true)

Current build errors:
${buildErrors.slice(0, 4000)}

The original sketch is attached - the component MUST match it visually. Only fix CODE errors.

START NOW: Read the component file and begin fixing.`;

          const chat = agentModel.startChat({
            history: [
              {
                role: "user",
                parts: [{ text: agentSystemPrompt }, imagePart],
              },
            ],
          });

          let iteration = 0;
          const MAX_ITERATIONS = 20;
          let taskComplete = false;

          while (iteration < MAX_ITERATIONS && !taskComplete) {
            iteration++;
            log(`🤖 Agent iteration ${iteration}...`);

            const response = await chat.sendMessage(
              iteration === 1
                ? "Start now. Read the component file and fix the errors."
                : "Continue. Fix any remaining errors and run build again.",
            );

            const functionCalls = response.response.functionCalls();

            if (functionCalls && functionCalls.length > 0) {
              for (const call of functionCalls) {
                const args = call.args as Record<string, string | boolean>;
                let toolResult = "";

                switch (call.name) {
                  case "read_file": {
                    log(`📖 Reading ${args.path}...`);
                    try {
                      const content = await sandbox.files.read(
                        args.path as string,
                      );
                      toolResult = content;
                    } catch (e) {
                      toolResult = `Error: ${e}`;
                    }
                    break;
                  }

                  case "write_file": {
                    log(`📝 Writing ${args.path}...`);
                    try {
                      await sandbox.files.write(
                        args.path as string,
                        args.content as string,
                      );
                      toolResult = "File written successfully";
                      if ((args.path as string).includes("component.tsx")) {
                        currentCode = args.content as string;
                        sendEvent("code", { code: currentCode });
                      }
                    } catch (e) {
                      toolResult = `Error: ${e}`;
                    }
                    break;
                  }

                  case "run_command": {
                    const cmd = args.command as string;
                    const cwd = (args.cwd as string) || "/home/user/app";
                    log(`⚡ Running: ${cmd}`);
                    try {
                      const cmdResult = await sandbox.commands.run(
                        `${cmd} 2>&1`,
                        {
                          cwd,
                          timeoutMs: 120000,
                        },
                      );
                      toolResult = `Exit code: ${cmdResult.exitCode}\nOutput:\n${cmdResult.stdout}${cmdResult.stderr}`;
                      if (
                        cmd.includes("npm run build") &&
                        cmdResult.exitCode === 0
                      ) {
                        log("✅ Build successful!");
                      }
                    } catch (e) {
                      toolResult = `Error: ${e}`;
                    }
                    break;
                  }

                  case "list_files": {
                    log(`📁 Listing ${args.path}...`);
                    try {
                      const files = await sandbox.files.list(
                        args.path as string,
                      );
                      toolResult = files.map((f) => f.name).join("\n");
                    } catch (e) {
                      toolResult = `Error: ${e}`;
                    }
                    break;
                  }

                  case "task_complete": {
                    taskComplete = true;
                    log(
                      args.success
                        ? "✅ Agent completed successfully!"
                        : `⚠️ ${args.message}`,
                    );
                    toolResult = "Task marked complete";
                    break;
                  }

                  default:
                    toolResult = `Unknown tool: ${call.name}`;
                }

                await chat.sendMessage([
                  {
                    functionResponse: {
                      name: call.name,
                      response: { result: toolResult },
                    },
                  },
                ]);
              }
            } else {
              const responseText = response.response.text();
              if (responseText) {
                log(`💬 ${responseText.slice(0, 100)}...`);
              }
            }
          }

          if (!taskComplete) {
            log("⚠️ Max iterations reached");
          }
        } else {
          log("✅ Build successful on first try!");
        }

        log(`🎉 Preview ready at ${sandboxUrl}`);

        sendEvent("sandbox", {
          url: sandboxUrl,
          sandboxId: sandbox.sandboxId,
        });

        sendEvent("complete", {
          code: currentCode,
          sandboxUrl,
          sandboxId: sandbox.sandboxId,
          success: true,
        });

        controller.close();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        log(`❌ Error: ${errMsg}`);
        sendEvent("error", { message: errMsg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function setupNewSandbox(
  sandbox: Sandbox,
  log: (msg: string) => void,
): Promise<string> {
  log("🚀 Starting dev server...");
  sandbox.commands
    .run("npm run dev", { cwd: "/home/user/app", timeoutMs: 0 })
    .catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const host = sandbox.getHost(3000);
  log("✅ Dev server ready");
  return `https://${host}`;
}

function detectShadcnImports(code: string): string[] {
  const componentMap: Record<string, string> = {
    Button: "button",
    Card: "card",
    CardHeader: "card",
    CardContent: "card",
    CardFooter: "card",
    CardTitle: "card",
    CardDescription: "card",
    Input: "input",
    Label: "label",
    Textarea: "textarea",
    Select: "select",
    Checkbox: "checkbox",
    RadioGroup: "radio-group",
    Switch: "switch",
    Slider: "slider",
    Progress: "progress",
    Badge: "badge",
    Avatar: "avatar",
    Dialog: "dialog",
    Sheet: "sheet",
    Popover: "popover",
    Tooltip: "tooltip",
    Tabs: "tabs",
    Accordion: "accordion",
    Alert: "alert",
    AlertDialog: "alert-dialog",
    Table: "table",
    Separator: "separator",
    ScrollArea: "scroll-area",
    Skeleton: "skeleton",
    Calendar: "calendar",
    Command: "command",
    ContextMenu: "context-menu",
    DropdownMenu: "dropdown-menu",
    HoverCard: "hover-card",
    Menubar: "menubar",
    NavigationMenu: "navigation-menu",
    Collapsible: "collapsible",
    AspectRatio: "aspect-ratio",
    Toggle: "toggle",
    ToggleGroup: "toggle-group",
  };

  const found = new Set<string>();

  for (const [, packageName] of Object.entries(componentMap)) {
    if (
      code.includes(`"@/components/ui/${packageName}"`) ||
      code.includes(`'@/components/ui/${packageName}'`) ||
      code.includes(`from "@/components/ui/${packageName}`) ||
      code.includes(`from '@/components/ui/${packageName}`)
    ) {
      found.add(packageName);
    }
  }

  return Array.from(found);
}

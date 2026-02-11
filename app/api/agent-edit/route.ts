import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sandbox } from "e2b";
import type { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MAX_ITERATIONS = 100;

interface AgentAction {
  type: "code" | "command" | "done" | "error";
  content: string;
  reasoning?: string;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`),
        );
      };

      try {
        const { prompt, currentCode, sandboxId, imageData } =
          await request.json();

        if (!prompt || !currentCode) {
          send("error", { message: "Prompt and current code are required" });
          controller.close();
          return;
        }

        // Connect to existing sandbox by ID
        let sandbox: Sandbox;
        try {
          sandbox = await Sandbox.connect(sandboxId, {
            apiKey: process.env.E2B_API_KEY,
          });
        } catch {
          send("error", { message: "Sandbox session not found or expired" });
          controller.close();
          return;
        }
        send("log", { message: "🤖 Agent starting..." });

        // Helper to run commands in sandbox
        const runCommand = async (
          cmd: string,
        ): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
          send("log", { message: `$ ${cmd}` });
          const result = await sandbox.commands.run(cmd, {
            cwd: "/home/user/app",
            timeoutMs: 120000,
          });
          if (result.stdout)
            send("log", { message: result.stdout.slice(0, 500) });
          if (result.stderr)
            send("log", { message: `⚠️ ${result.stderr.slice(0, 500)}` });
          return result;
        };

        // Helper to write code to sandbox
        const writeCode = async (code: string): Promise<void> => {
          await sandbox.files.write("/home/user/app/app/component.tsx", code);
          send("code", { code });
        };

        // Helper to check for build errors
        const checkBuild = async (): Promise<{
          success: boolean;
          errors: string;
        }> => {
          const result = await sandbox.commands.run("npm run build 2>&1", {
            cwd: "/home/user/app",
            timeoutMs: 120000,
          });
          const output = result.stdout + result.stderr;
          return {
            success: result.exitCode === 0,
            errors: output,
          };
        };

        // Helper to extract shadcn components from errors
        const extractShadcnComponents = (errorText: string): string[] => {
          const regex = /@\/components\/ui\/([a-z-]+)/gi;
          const matches = errorText.matchAll(regex);
          return [...new Set([...matches].map((m) => m[1].toLowerCase()))];
        };

        // Helper to extract npm packages from errors
        const extractMissingPackages = (errorText: string): string[] => {
          const regex = /Cannot find module ['"]([@a-z0-9-/]+)['"]/gi;
          const matches = errorText.matchAll(regex);
          return [...new Set([...matches].map((m) => m[1]))].filter(
            (pkg) => !pkg.startsWith("@/") && !pkg.startsWith("./"),
          );
        };

        const model = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
        });

        let currentCodeState = currentCode;
        let lastErrors = "";
        let iteration = 0;

        // Main agent loop
        while (iteration < MAX_ITERATIONS) {
          iteration++;
          send("log", {
            message: `\n🔄 Iteration ${iteration}/${MAX_ITERATIONS}`,
          });

          // Build the agent prompt
          const agentPrompt = `You are an autonomous coding agent. You have access to a Next.js sandbox with shadcn/ui.

CURRENT COMPONENT CODE:
\`\`\`tsx
${currentCodeState}
\`\`\`

${lastErrors ? `CURRENT BUILD ERRORS:\n\`\`\`\n${lastErrors.slice(0, 2000)}\n\`\`\`` : ""}

${iteration === 1 ? `USER REQUEST: ${prompt}` : "Fix the build errors above."}

${imageData && iteration === 1 ? "The user has provided a sketch/drawing showing what they want." : ""}

You can respond with ONE of these actions:

1. WRITE CODE - Update the component
   Respond with:
   ACTION: CODE
   REASONING: <why you're making this change>
   \`\`\`tsx
   <complete component code>
   \`\`\`

2. RUN COMMAND - Install a package or run a terminal command
   Respond with:
   ACTION: COMMAND
   REASONING: <why you need this command>
   COMMAND: <shell command to run>

3. DONE - Everything is working
   Respond with:
   ACTION: DONE
   REASONING: <summary of what you did>

Rules:
- For shadcn components, use: npx shadcn@latest add <component> --yes
- For npm packages, use: npm install <package>
- Use @/components/ui/* for shadcn imports
- Use lucide-react for icons
- Always export default the main component
- Fix ALL errors before saying DONE`;

          // Call the model
          let result: Awaited<ReturnType<typeof model.generateContent>>;
          if (imageData && iteration === 1) {
            const imagePart = {
              inlineData: {
                data: imageData.split(",")[1],
                mimeType: imageData.split(";")[0].split(":")[1],
              },
            };
            result = await model.generateContent([agentPrompt, imagePart]);
          } else {
            result = await model.generateContent(agentPrompt);
          }

          const response = result.response.text();

          // Parse the agent's action
          const action = parseAgentAction(response);

          if (action.reasoning) {
            send("log", { message: `💭 ${action.reasoning}` });
          }

          if (action.type === "code") {
            send("log", { message: "📝 Writing updated code..." });
            currentCodeState = action.content;
            await writeCode(currentCodeState);

            // Check build
            send("log", { message: "🔨 Checking build..." });
            const buildResult = await checkBuild();

            if (buildResult.success) {
              send("log", { message: "✅ Build successful!" });
              lastErrors = "";

              // One more iteration to confirm or agent says DONE
              continue;
            } else {
              lastErrors = buildResult.errors;
              send("log", { message: "❌ Build failed, will try to fix..." });

              // Auto-detect and install missing shadcn components
              const shadcnComponents = extractShadcnComponents(
                buildResult.errors,
              );
              if (shadcnComponents.length > 0) {
                send("log", {
                  message: `📦 Auto-installing shadcn: ${shadcnComponents.join(", ")}`,
                });
                for (const comp of shadcnComponents) {
                  await runCommand(`npx shadcn@latest add ${comp} --yes`);
                }
                // Re-check build after installing
                const retryBuild = await checkBuild();
                if (retryBuild.success) {
                  lastErrors = "";
                  send("log", { message: "✅ Build now successful!" });
                } else {
                  lastErrors = retryBuild.errors;
                }
              }

              // Auto-detect and install missing npm packages
              const missingPackages = extractMissingPackages(
                buildResult.errors,
              );
              if (missingPackages.length > 0) {
                send("log", {
                  message: `📦 Auto-installing: ${missingPackages.join(", ")}`,
                });
                await runCommand(`npm install ${missingPackages.join(" ")}`);
                const retryBuild = await checkBuild();
                if (retryBuild.success) {
                  lastErrors = "";
                  send("log", { message: "✅ Build now successful!" });
                } else {
                  lastErrors = retryBuild.errors;
                }
              }
            }
          } else if (action.type === "command") {
            send("log", { message: `🖥️ Running: ${action.content}` });
            await runCommand(action.content);

            // Re-check build after command
            const buildResult = await checkBuild();
            if (buildResult.success) {
              lastErrors = "";
            } else {
              lastErrors = buildResult.errors;
            }
          } else if (action.type === "done") {
            send("log", { message: "✅ Agent finished successfully!" });
            break;
          } else if (action.type === "error") {
            send("log", { message: `❌ Agent error: ${action.content}` });
            break;
          }

          // If no errors, we're done
          if (!lastErrors) {
            send("log", { message: "✅ No errors - complete!" });
            break;
          }
        }

        if (iteration >= MAX_ITERATIONS && lastErrors) {
          send("log", {
            message: `⚠️ Reached max iterations with remaining errors`,
          });
        }

        send("complete", { code: currentCodeState });
        controller.close();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        send("error", { message: errMsg });
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

function parseAgentAction(response: string): AgentAction {
  const lines = response.split("\n");

  // Find ACTION line
  const actionLine = lines.find((l) => l.trim().startsWith("ACTION:"));
  if (!actionLine) {
    // Try to extract code anyway
    const codeMatch = response.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/);
    if (codeMatch) {
      return { type: "code", content: codeMatch[1].trim() };
    }
    return { type: "error", content: "Could not parse agent response" };
  }

  const actionType = actionLine.replace("ACTION:", "").trim().toUpperCase();

  // Find REASONING line
  const reasoningLine = lines.find((l) => l.trim().startsWith("REASONING:"));
  const reasoning = reasoningLine?.replace("REASONING:", "").trim();

  if (actionType === "CODE") {
    const codeMatch = response.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/);
    if (codeMatch) {
      return { type: "code", content: codeMatch[1].trim(), reasoning };
    }
    return { type: "error", content: "Could not find code block" };
  }

  if (actionType === "COMMAND") {
    const commandLine = lines.find((l) => l.trim().startsWith("COMMAND:"));
    if (commandLine) {
      return {
        type: "command",
        content: commandLine.replace("COMMAND:", "").trim(),
        reasoning,
      };
    }
    return { type: "error", content: "Could not find command" };
  }

  if (actionType === "DONE") {
    return { type: "done", content: "", reasoning };
  }

  return { type: "error", content: `Unknown action type: ${actionType}` };
}

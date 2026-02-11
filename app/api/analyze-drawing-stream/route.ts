import { type NextRequest } from "next/server";
import {
  generateWebsite,
  getGeminiClient,
  createWebsitePrompt,
} from "@/lib/gemini";
import {
  validateCodeQuality,
  sandboxValidateCode,
} from "@/lib/quality-validator";
import { validateReactComponent } from "@/lib/code-sandbox";
import { executeComponentInE2B } from "@/lib/e2b-sandbox";

const MAX_ITERATIONS = 100;

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.image) {
    return new Response(JSON.stringify({ error: "Image data is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        sendEvent("start", { message: "Starting AI sandbox generation..." });

        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
          generationConfig: {
            temperature: 1.0,
            topP: 0.95,
            topK: 64,
          },
        });

        let currentCode = "";
        let iteration = 0;
        let allErrors: string[] = [];

        while (iteration < MAX_ITERATIONS) {
          iteration++;
          sendEvent("iteration", { current: iteration, max: MAX_ITERATIONS });

          try {
            // Generate code
            if (iteration === 1) {
              sendEvent("log", { message: "🎨 Generating initial code..." });
              currentCode = await generateWebsite(
                body.image,
                body.styleGuide,
                body.customPrompt,
                body.colorPalette,
              );
              sendEvent("log", { message: "✅ Initial code generated" });
              sendEvent("code", { code: currentCode, iteration });
            } else {
              sendEvent("log", { message: "🔧 Regenerating with fixes..." });

              const fixPrompt = `${allErrors.join("\n\n")}

Previous code had errors. Generate a FIXED version that addresses ALL issues above.
${createWebsitePrompt(body.styleGuide, body.customPrompt, body.colorPalette)}`;

              const mimeType = body.image.startsWith("data:image/jpeg")
                ? "image/jpeg"
                : "image/png";
              const imagePart = {
                inlineData: {
                  data: body.image.split(",")[1],
                  mimeType,
                },
              };

              const result = await model.generateContent([
                fixPrompt,
                imagePart,
              ]);
              const text = result.response.text();
              const codeMatch = text.match(
                /```(?:tsx|typescript|jsx)?\s*([\s\S]*?)```/,
              );

              if (!codeMatch) {
                throw new Error("Failed to extract code from AI response");
              }

              currentCode = codeMatch[1]
                .trim()
                .replace(/\/\*[\s\S]*?\*\//g, "")
                .replace(/\/\/.*/g, "")
                .replace(/^\s*[\r\n]/gm, "");

              sendEvent("log", { message: "✅ Fixed code generated" });
              sendEvent("code", { code: currentCode, iteration });
            }

            // Validate syntax
            sendEvent("log", { message: "🔍 Validating syntax..." });
            const syntaxCheck = await sandboxValidateCode(currentCode);
            if (!syntaxCheck.valid) {
              sendEvent("log", {
                message: `❌ Syntax error: ${syntaxCheck.error}`,
                type: "error",
              });
              allErrors.push(`SYNTAX ERROR: ${syntaxCheck.error}`);
              continue;
            }
            sendEvent("log", { message: "✅ Syntax validation passed" });

            // Validate React component
            sendEvent("log", { message: "🔍 Validating React component..." });
            const componentCheck = await validateReactComponent(currentCode);
            if (!componentCheck.valid) {
              sendEvent("log", {
                message: "❌ Component validation failed",
                type: "error",
              });
              componentCheck.errors.forEach((err) => {
                sendEvent("log", { message: `  - ${err}`, type: "error" });
              });
              allErrors.push(
                `COMPONENT ERRORS:\n${componentCheck.errors.join("\n")}\n\nSUGGESTIONS:\n${componentCheck.suggestions.join("\n")}`,
              );
              continue;
            }
            sendEvent("log", { message: "✅ Component structure validated" });

            // Check quality
            sendEvent("log", { message: "📊 Scoring quality..." });
            const quality = validateCodeQuality(currentCode);
            sendEvent("quality", {
              score: quality.score,
              details: quality.details,
              iteration,
            });
            sendEvent("log", { message: `Quality: ${quality.score}/100` });

            if (quality.score >= 70) {
              sendEvent("log", {
                message: `✅ Success! Quality threshold met`,
              });
              sendEvent("complete", {
                code: currentCode,
                quality: quality.score,
                iterations: iteration,
                success: true,
              });
              controller.close();
              return;
            }

            // If quality is low, add issues to errors
            if (quality.score < 70) {
              sendEvent("log", {
                message: "⚠️ Quality below threshold (70)",
                type: "warning",
              });
              quality.issues.forEach((issue) => {
                sendEvent("log", { message: `  - ${issue}`, type: "warning" });
              });
              allErrors.push(
                `QUALITY ISSUES:\n${quality.issues.join("\n")}\n\nMake it MORE creative, animated, and premium!`,
              );
            }
          } catch (error) {
            const errMsg =
              error instanceof Error ? error.message : "Unknown error";
            sendEvent("log", { message: `❌ Error: ${errMsg}`, type: "error" });
            allErrors.push(`GENERATION ERROR: ${errMsg}`);
          }
        }

        // Max iterations reached
        sendEvent("log", {
          message: `⚠️ Max iterations (${MAX_ITERATIONS}) reached`,
          type: "warning",
        });
        const finalQuality = currentCode
          ? validateCodeQuality(currentCode).score
          : 0;
        sendEvent("complete", {
          code: currentCode || "// Failed to generate code",
          quality: finalQuality,
          iterations: MAX_ITERATIONS,
          success: false,
        });
        controller.close();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
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

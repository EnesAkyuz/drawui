import "dotenv/config";
import { Template, defaultBuildLogger } from "e2b";
import { template } from "./template";

async function main() {
  console.log("🚀 Building E2B template with Next.js + shadcn...");

  await Template.build(template, "nextjs-shadcn", {
    cpuCount: 2,
    memoryMB: 4096, // 4GB RAM for the build
    onBuildLogs: defaultBuildLogger(),
  });

  console.log("✅ Template built successfully!");
  console.log("Use 'nextjs-shadcn' as your template name in Sandbox.create()");
}

main().catch(console.error);

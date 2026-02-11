import { Sandbox } from "e2b";

export interface E2BSandboxResult {
  success: boolean;
  url?: string;
  errors: string[];
  logs: string[];
  sandboxId?: string;
}

export interface E2BSandboxSession {
  sandbox: Sandbox;
  url: string;
  logs: string[];
  isReady: boolean;
  isDevServerRunning: boolean;
}

// Store active sandbox sessions
const activeSandboxes = new Map<string, E2BSandboxSession>();

// Store the pre-warmed sandbox ID for quick access
let prewarmedSandboxId: string | null = null;

/**
 * Extract shadcn component names from build errors
 */
function extractShadcnComponents(errorText: string): string[] {
  const regex = /@\/components\/ui\/([a-z-]+)/gi;
  const matches = errorText.matchAll(regex);
  return [...new Set([...matches].map((m) => m[1].toLowerCase()))];
}

/**
 * Execute React component in e2b sandbox with terminal access
 * The sandbox can run commands to install shadcn, dependencies, etc.
 */
export async function executeComponentInE2B(
  code: string,
  onLog: (log: string) => void,
  _previousErrors?: string[],
): Promise<E2BSandboxResult> {
  const apiKey = process.env.E2B_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      errors: [
        "E2B_API_KEY not configured. Add E2B_API_KEY to your .env.local file.",
      ],
      logs: [],
    };
  }

  const logs: string[] = [];
  const errors: string[] = [];

  const log = (msg: string) => {
    logs.push(msg);
    onLog(msg);
  };

  let sandbox: Sandbox | null = null;

  try {
    log("🚀 Creating e2b sandbox with custom template...");
    sandbox = await Sandbox.create("nextjs-shadcn", {
      apiKey,
      timeoutMs: 300000, // 5 minute sandbox timeout
    });
    log(`✅ Sandbox created (ID: ${sandbox.sandboxId})`);

    // Template has everything pre-installed - just write the component
    log("📝 Writing component...");
    await sandbox.files.write("/home/user/app/app/component.tsx", code);
    log("✅ Component written");

    // Start dev server (template has everything pre-installed)
    log("🚀 Starting dev server...");
    sandbox.commands
      .run("npm run dev", {
        cwd: "/home/user/app",
        timeoutMs: 0,
      })
      .catch(() => {});

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Get the public URL
    const host = sandbox.getHost(3000);
    const fullUrl = `https://${host}`;
    log(`✅ Server running at ${fullUrl}`);

    // Store the session
    activeSandboxes.set(sandbox.sandboxId, {
      sandbox,
      url: fullUrl,
      logs,
      isReady: true,
      isDevServerRunning: true,
    });

    return {
      success: true,
      url: fullUrl,
      errors: [],
      logs,
      sandboxId: sandbox.sandboxId,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    errors.push(errMsg);
    log(`❌ Error: ${errMsg}`);

    // Try to close sandbox on error
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch {
        // Ignore cleanup errors
      }
    }

    return {
      success: false,
      errors,
      logs,
    };
  }
}

/**
 * Close a sandbox session
 */
export async function closeSandbox(sandboxId: string): Promise<void> {
  const session = activeSandboxes.get(sandboxId);
  if (session) {
    try {
      await session.sandbox.kill();
      activeSandboxes.delete(sandboxId);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Get an active sandbox session
 */
export function getSandboxSession(
  sandboxId: string,
): E2BSandboxSession | undefined {
  return activeSandboxes.get(sandboxId);
}

/**
 * Update component code in an existing sandbox
 */
export async function updateComponentInSandbox(
  sandboxId: string,
  newCode: string,
  onLog: (log: string) => void,
): Promise<E2BSandboxResult> {
  const session = activeSandboxes.get(sandboxId);

  if (!session) {
    return {
      success: false,
      errors: ["Sandbox session not found"],
      logs: [],
    };
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    onLog(msg);
  };

  try {
    log("📝 Updating component...");
    await session.sandbox.files.write(
      "/home/user/app/app/component.tsx",
      newCode,
    );
    log("✅ Component updated (hot reload should apply)");

    return {
      success: true,
      url: session.url,
      errors: [],
      logs,
      sandboxId,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      errors: [errMsg],
      logs,
    };
  }
}

/**
 * Pre-warm a sandbox with Next.js + shadcn ready to go.
 * Uses the pre-built 'nextjs-shadcn' template which has everything installed.
 */
export async function prewarmSandbox(onLog?: (log: string) => void): Promise<{
  success: boolean;
  sandboxId?: string;
  url?: string;
  error?: string;
}> {
  const apiKey = process.env.E2B_API_KEY;

  if (!apiKey) {
    return { success: false, error: "E2B_API_KEY not configured" };
  }

  const log = onLog || console.log;

  try {
    log("🚀 Pre-warming sandbox with custom template...");

    // Use custom template with Next.js + shadcn pre-installed
    const sandbox = await Sandbox.create("nextjs-shadcn", {
      apiKey,
      timeoutMs: 600000, // 10 minute timeout for pre-warmed sandbox
    });

    log(`✅ Sandbox created (ID: ${sandbox.sandboxId})`);

    // Start dev server (everything is pre-installed in the template)
    log("🚀 Starting dev server...");
    sandbox.commands
      .run("npm run dev", { cwd: "/home/user/app", timeoutMs: 0 })
      .catch(() => {});

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const host = sandbox.getHost(3000);
    const fullUrl = `https://${host}`;
    log(`✅ Server running at ${fullUrl}`);

    // Store the session
    activeSandboxes.set(sandbox.sandboxId, {
      sandbox,
      url: fullUrl,
      logs: [],
      isReady: true,
      isDevServerRunning: true,
    });

    prewarmedSandboxId = sandbox.sandboxId;

    return {
      success: true,
      sandboxId: sandbox.sandboxId,
      url: fullUrl,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    log(`❌ Error: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}

/**
 * Get the pre-warmed sandbox, or return null if not available
 */
export function getPrewarmedSandbox(): E2BSandboxSession | null {
  if (!prewarmedSandboxId) return null;
  return activeSandboxes.get(prewarmedSandboxId) || null;
}

/**
 * Deploy code to an existing pre-warmed sandbox (much faster than creating new)
 */
export async function deployToPrewarmedSandbox(
  code: string,
  onLog: (log: string) => void,
): Promise<E2BSandboxResult> {
  const session = getPrewarmedSandbox();

  if (!session) {
    onLog("⚠️ No pre-warmed sandbox available, creating new one...");
    return executeComponentInE2B(code, onLog);
  }

  const logs: string[] = [];
  const errors: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    onLog(msg);
  };

  const sandbox = session.sandbox;

  try {
    log("📝 Writing component to pre-warmed sandbox...");
    await sandbox.files.write("/home/user/app/app/component.tsx", code);
    log("✅ Component written");

    // Check build
    log("🔨 Checking build...");
    const buildResult = await sandbox.commands.run("npm run build 2>&1", {
      cwd: "/home/user/app",
      timeoutMs: 120000,
    });

    if (buildResult.exitCode !== 0) {
      const buildErrors = buildResult.stdout + buildResult.stderr;

      // Auto-detect and install missing shadcn components
      const neededComponents = extractShadcnComponents(buildErrors);
      if (neededComponents.length > 0) {
        log(`📦 Installing shadcn: ${neededComponents.join(", ")}...`);
        for (const comp of neededComponents) {
          await sandbox.commands.run(`npx shadcn@latest add ${comp} --yes`, {
            cwd: "/home/user/app",
            timeoutMs: 60000,
          });
        }

        // Retry build
        const retryBuild = await sandbox.commands.run("npm run build 2>&1", {
          cwd: "/home/user/app",
          timeoutMs: 120000,
        });

        if (retryBuild.exitCode !== 0) {
          errors.push(
            `Build error:\n${retryBuild.stdout}\n${retryBuild.stderr}`,
          );
          return { success: false, errors, logs, sandboxId: sandbox.sandboxId };
        }
      } else {
        errors.push(`Build error:\n${buildErrors}`);
        return { success: false, errors, logs, sandboxId: sandbox.sandboxId };
      }
    }

    log("✅ Build successful!");
    log(`🔄 Hot reload active at ${session.url}`);

    return {
      success: true,
      url: session.url,
      errors: [],
      logs,
      sandboxId: sandbox.sandboxId,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    errors.push(errMsg);
    log(`❌ Error: ${errMsg}`);
    return { success: false, errors, logs };
  }
}

/**
 * Clear the pre-warmed sandbox reference (but don't kill it if in use)
 */
export function clearPrewarmedSandbox(): void {
  prewarmedSandboxId = null;
}

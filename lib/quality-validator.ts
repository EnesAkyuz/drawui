/**
 * Quality validation and sandbox compilation for generated code
 */

export interface QualityScore {
  score: number;
  passed: boolean;
  issues: string[];
  details: {
    hasAnimations: boolean;
    hasIcons: boolean;
    hasMultipleComponents: boolean;
    componentCount: number;
    iconCount: number;
    animationCount: number;
    hasUseClient: boolean;
    hasMotionImport: boolean;
    hasLucideImport: boolean;
    syntaxValid: boolean;
  };
}

/**
 * Validates the quality of generated code
 */
export function validateCodeQuality(code: string): QualityScore {
  const issues: string[] = [];
  let score = 0;

  // Check for "use client" directive
  const hasUseClient =
    code.includes('"use client"') || code.includes("'use client'");
  if (hasUseClient) {
    score += 10;
  } else {
    issues.push('Missing "use client" directive (required for animations)');
  }

  // Check for framer-motion import
  const hasMotionImport = code.includes('from "framer-motion"');
  if (hasMotionImport) {
    score += 15;
  } else {
    issues.push("Missing framer-motion import");
  }

  // Check for lucide-react import
  const hasLucideImport = code.includes('from "lucide-react"');
  if (hasLucideImport) {
    score += 15;
  } else {
    issues.push("Missing lucide-react icons");
  }

  // Count animations
  const animationMatches = code.match(
    /initial=|whileInView=|whileHover=|animate=/g,
  );
  const animationCount = animationMatches ? animationMatches.length : 0;
  const hasAnimations = animationCount >= 5;

  if (hasAnimations) {
    score += 20;
  } else {
    issues.push(
      `Not enough animations (found ${animationCount}, need at least 5)`,
    );
  }

  // Count icons usage
  const iconMatches = code.match(
    /<[A-Z][a-zA-Z]+\s+className="[^"]*w-\d+[^"]*"/g,
  );
  const iconCount = iconMatches ? iconMatches.length : 0;
  const hasIcons = iconCount >= 6;

  if (hasIcons) {
    score += 15;
  } else {
    issues.push(`Not enough icons (found ${iconCount}, need at least 6)`);
  }

  // Count shadcn component imports
  const componentImports = code.match(/from "@\/components\/ui\/[^"]+"/g);
  const componentCount = componentImports ? new Set(componentImports).size : 0;
  const hasMultipleComponents = componentCount >= 5;

  if (hasMultipleComponents) {
    score += 20;
  } else {
    issues.push(
      `Not enough shadcn components (found ${componentCount}, need at least 5)`,
    );
  }

  // Check for gradients (modern styling)
  const hasGradients =
    code.includes("bg-gradient-to-") ||
    (code.includes("from-") && code.includes("to-"));
  if (hasGradients) {
    score += 5;
  } else {
    issues.push("No gradient styling detected");
  }

  // Check for glassmorphism/modern effects
  const hasModernEffects =
    code.includes("backdrop-blur") || code.includes("bg-white/");
  if (hasModernEffects) {
    score += 5;
  } else {
    issues.push("No modern visual effects (glassmorphism/transparency)");
  }

  // Basic syntax checks
  const syntaxValid =
    code.includes("export default function GeneratedWebsite") &&
    code.includes("return (") &&
    code.includes("</") &&
    !code.includes("undefined") &&
    !code.includes("// TODO");

  if (syntaxValid) {
    score += 10;
  } else {
    issues.push("Basic syntax validation failed");
  }

  const passed = score >= 70;

  return {
    score,
    passed,
    issues,
    details: {
      hasAnimations,
      hasIcons,
      hasMultipleComponents,
      componentCount,
      iconCount,
      animationCount,
      hasUseClient,
      hasMotionImport,
      hasLucideImport,
      syntaxValid,
    },
  };
}

/**
 * Validates that code can be transpiled (sandbox check)
 */
export async function sandboxValidateCode(
  code: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic validation - check for common syntax errors
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;

    if (openBraces !== closeBraces) {
      return {
        valid: false,
        error: `Unmatched braces: ${openBraces} open, ${closeBraces} close`,
      };
    }
    if (openParens !== closeParens) {
      return {
        valid: false,
        error: `Unmatched parentheses: ${openParens} open, ${closeParens} close`,
      };
    }
    if (openBrackets !== closeBrackets) {
      return {
        valid: false,
        error: `Unmatched brackets: ${openBrackets} open, ${closeBrackets} close`,
      };
    }

    // Check for incomplete JSX
    const jsxOpenTags = code.match(/<([A-Z][a-zA-Z0-9.]*)/g) || [];
    const jsxCloseTags = code.match(/<\/([A-Z][a-zA-Z0-9.]*)/g) || [];
    const selfClosingTags = code.match(/<[A-Z][a-zA-Z0-9.]*[^>]*\/>/g) || [];

    // Very basic check - proper validation would need a parser
    if (
      jsxOpenTags.length > 0 &&
      jsxCloseTags.length === 0 &&
      selfClosingTags.length === 0
    ) {
      return { valid: false, error: "JSX tags appear unclosed" };
    }

    // Check for common errors
    if (
      code.includes("export default") &&
      !code.includes("export default function")
    ) {
      return { valid: false, error: "Invalid export format" };
    }

    if (!code.includes("return")) {
      return { valid: false, error: "Component has no return statement" };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Generates improvement instructions based on quality issues
 */
export function generateImprovementPrompt(quality: QualityScore): string {
  const instructions: string[] = [];

  if (!quality.details.hasUseClient) {
    instructions.push('- Add "use client" at the very top of the file');
  }

  if (!quality.details.hasMotionImport) {
    instructions.push(
      '- Import motion from framer-motion: import { motion } from "framer-motion"',
    );
  }

  if (!quality.details.hasLucideImport) {
    instructions.push(
      "- Import at least 8 icons from lucide-react and use them throughout",
    );
  }

  if (!quality.details.hasAnimations || quality.details.animationCount < 5) {
    instructions.push(
      "- Add framer-motion animations: initial, whileInView, whileHover on hero, cards, and buttons",
    );
    instructions.push(
      "- Use stagger effects for lists/grids with delay: i * 0.1",
    );
  }

  if (!quality.details.hasIcons || quality.details.iconCount < 6) {
    instructions.push(
      "- Add lucide-react icons to buttons, cards, features, and navigation (minimum 8 icons)",
    );
  }

  if (
    !quality.details.hasMultipleComponents ||
    quality.details.componentCount < 5
  ) {
    instructions.push(
      "- Use more shadcn/ui components: Card, Button, Badge, Progress, Tabs, Avatar, Separator",
    );
  }

  return `
CRITICAL QUALITY ISSUES - MUST FIX:

${instructions.join("\n")}

Current quality score: ${quality.score}/100 (need 70+ to pass)

Generate a NEW version that fixes ALL these issues. This is a premium website - make it stunning!
`;
}

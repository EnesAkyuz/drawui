import { toast } from "sonner";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingComponents: string[];
  hasImports: boolean;
}

/**
 * Validates generated code for common issues
 */
export function validateGeneratedCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingComponents: string[] = [];

  // Check for basic syntax issues
  if (!code.trim()) {
    errors.push("Generated code is empty");
    return {
      valid: false,
      errors,
      warnings,
      missingComponents,
      hasImports: false,
    };
  }

  // Check if it's wrapped in markdown code blocks
  if (code.includes("```")) {
    warnings.push("Code contains markdown formatting - attempting to clean");
  }

  // Check for imports
  const hasImports = code.includes("import ");

  // Extract component usage from the code
  const componentMatches = code.match(/<([A-Z][a-zA-Z]*)/g);
  const usedComponents = new Set(
    componentMatches?.map((match) => match.slice(1)) || [],
  );

  // Extract imported components
  const importMatches = code.match(
    /import\s+{([^}]+)}\s+from\s+["']@\/components\/ui\/([^"']+)["']/g,
  );
  const importedComponents = new Set<string>();

  if (importMatches) {
    importMatches.forEach((imp) => {
      const match = imp.match(/import\s+{([^}]+)}/);
      if (match) {
        const components = match[1].split(",").map((c) => c.trim());
        components.forEach((c) => importedComponents.add(c));
      }
    });
  }

  // Check for used but not imported components
  const availableShadcnComponents = [
    "Alert",
    "AlertDescription",
    "AlertTitle",
    "AlertDialog",
    "AlertDialogAction",
    "AlertDialogCancel",
    "AlertDialogContent",
    "Avatar",
    "AvatarFallback",
    "AvatarImage",
    "Badge",
    "Button",
    "Card",
    "CardContent",
    "CardDescription",
    "CardFooter",
    "CardHeader",
    "CardTitle",
    "Checkbox",
    "Dialog",
    "DialogContent",
    "DialogDescription",
    "DialogHeader",
    "DialogTitle",
    "DialogTrigger",
    "DropdownMenu",
    "DropdownMenuContent",
    "DropdownMenuItem",
    "DropdownMenuTrigger",
    "Input",
    "Label",
    "RadioGroup",
    "RadioGroupItem",
    "ScrollArea",
    "Select",
    "SelectContent",
    "SelectItem",
    "SelectTrigger",
    "SelectValue",
    "Separator",
    "Sheet",
    "SheetContent",
    "SheetDescription",
    "SheetHeader",
    "SheetTitle",
    "SheetTrigger",
    "Slider",
    "Switch",
    "Tabs",
    "TabsContent",
    "TabsList",
    "TabsTrigger",
    "Textarea",
    "Toggle",
    "ToggleGroup",
    "ToggleGroupItem",
    "Tooltip",
    "TooltipContent",
    "TooltipProvider",
    "TooltipTrigger",
  ];

  usedComponents.forEach((component) => {
    if (
      availableShadcnComponents.includes(component) &&
      !importedComponents.has(component)
    ) {
      missingComponents.push(component);
    }
  });

  // Check for common syntax errors
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(
      `Mismatched braces: ${openBraces} opening, ${closeBraces} closing`,
    );
  }

  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(
      `Mismatched parentheses: ${openParens} opening, ${closeParens} closing`,
    );
  }

  // Check for export default
  if (!code.includes("export default")) {
    errors.push("Missing 'export default' statement");
  }

  // Check for GeneratedWebsite component
  if (!code.includes("GeneratedWebsite")) {
    warnings.push("Component name should be 'GeneratedWebsite'");
  }

  // Check for common mistakes
  if (code.includes("className=undefined")) {
    warnings.push("Contains undefined className values");
  }

  if (code.includes("// ") || code.includes("/* ")) {
    warnings.push("Contains comments (should be removed)");
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings, missingComponents, hasImports };
}

/**
 * Attempts to fix common issues in generated code
 */
export function attemptCodeFix(code: string): string {
  let fixed = code;

  // Remove markdown code blocks
  fixed = fixed.replace(/```tsx?\s*/g, "").replace(/```\s*/g, "");

  // Remove comments
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, "");
  fixed = fixed.replace(/\/\/.*/g, "");

  // Remove empty lines
  fixed = fixed.replace(/^\s*[\r\n]/gm, "");

  // Trim whitespace
  fixed = fixed.trim();

  return fixed;
}

/**
 * Detects which shadcn components are missing and returns install commands
 */
export function getMissingComponentInfo(missingComponents: string[]): {
  components: string[];
  installCommands: string[];
  componentToFile: Map<string, string>;
} {
  const componentToFile = new Map<string, string>([
    ["Alert", "alert"],
    ["AlertDescription", "alert"],
    ["AlertTitle", "alert"],
    ["AlertDialog", "alert-dialog"],
    ["Avatar", "avatar"],
    ["Badge", "badge"],
    ["Button", "button"],
    ["Card", "card"],
    ["Checkbox", "checkbox"],
    ["Dialog", "dialog"],
    ["DropdownMenu", "dropdown-menu"],
    ["Input", "input"],
    ["Label", "label"],
    ["RadioGroup", "radio-group"],
    ["ScrollArea", "scroll-area"],
    ["Select", "select"],
    ["Separator", "separator"],
    ["Sheet", "sheet"],
    ["Slider", "slider"],
    ["Switch", "switch"],
    ["Tabs", "tabs"],
    ["Textarea", "textarea"],
    ["Toggle", "toggle"],
    ["ToggleGroup", "toggle-group"],
    ["Tooltip", "tooltip"],
  ]);

  const filesToInstall = new Set<string>();
  missingComponents.forEach((comp) => {
    const file = componentToFile.get(comp);
    if (file) {
      filesToInstall.add(file);
    }
  });

  const installCommands = Array.from(filesToInstall).map(
    (file) => `bunx shadcn@latest add ${file}`,
  );

  return {
    components: missingComponents,
    installCommands,
    componentToFile,
  };
}

/**
 * Shows validation warnings/errors to the user
 */
export function showValidationFeedback(result: ValidationResult) {
  if (!result.valid) {
    toast.error("Generated code has errors", {
      description: result.errors[0],
      duration: 5000,
    });
  } else if (result.warnings.length > 0) {
    toast.warning("Code has warnings", {
      description: result.warnings[0],
      duration: 4000,
    });
  }

  if (result.missingComponents.length > 0) {
    const info = getMissingComponentInfo(result.missingComponents);
    toast.warning(`Missing ${info.components.length} component(s)`, {
      description: `Components: ${info.components.slice(0, 3).join(", ")}${info.components.length > 3 ? "..." : ""}`,
      duration: 5000,
    });
  }
}

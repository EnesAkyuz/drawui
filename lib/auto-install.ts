import { toast } from "sonner";

/**
 * Auto-installs missing shadcn/ui components
 * Note: This requires server-side execution or a backend endpoint
 */
export async function autoInstallComponents(
  missingComponents: string[],
): Promise<boolean> {
  const componentToFile = new Map<string, string>([
    // Layout & Containers
    ["Card", "card"],
    ["CardContent", "card"],
    ["CardDescription", "card"],
    ["CardFooter", "card"],
    ["CardHeader", "card"],
    ["CardTitle", "card"],
    ["Separator", "separator"],
    ["ScrollArea", "scroll-area"],
    ["AspectRatio", "aspect-ratio"],

    // Buttons & Interactive
    ["Button", "button"],
    ["Toggle", "toggle"],
    ["ToggleGroup", "toggle-group"],
    ["ToggleGroupItem", "toggle-group"],
    ["Switch", "switch"],

    // Form Inputs
    ["Input", "input"],
    ["Textarea", "textarea"],
    ["Checkbox", "checkbox"],
    ["Label", "label"],
    ["RadioGroup", "radio-group"],
    ["RadioGroupItem", "radio-group"],
    ["Select", "select"],
    ["SelectContent", "select"],
    ["SelectItem", "select"],
    ["SelectTrigger", "select"],
    ["SelectValue", "select"],
    ["SelectGroup", "select"],
    ["SelectLabel", "select"],
    ["Slider", "slider"],

    // Navigation & Menus
    ["NavigationMenu", "navigation-menu"],
    ["NavigationMenuContent", "navigation-menu"],
    ["NavigationMenuItem", "navigation-menu"],
    ["NavigationMenuLink", "navigation-menu"],
    ["NavigationMenuList", "navigation-menu"],
    ["NavigationMenuTrigger", "navigation-menu"],
    ["Menubar", "menubar"],
    ["MenubarMenu", "menubar"],
    ["MenubarTrigger", "menubar"],
    ["MenubarContent", "menubar"],
    ["MenubarItem", "menubar"],
    ["MenubarSeparator", "menubar"],
    ["DropdownMenu", "dropdown-menu"],
    ["DropdownMenuContent", "dropdown-menu"],
    ["DropdownMenuItem", "dropdown-menu"],
    ["DropdownMenuLabel", "dropdown-menu"],
    ["DropdownMenuSeparator", "dropdown-menu"],
    ["DropdownMenuTrigger", "dropdown-menu"],
    ["ContextMenu", "context-menu"],
    ["ContextMenuContent", "context-menu"],
    ["ContextMenuItem", "context-menu"],
    ["ContextMenuTrigger", "context-menu"],

    // Content Organization
    ["Tabs", "tabs"],
    ["TabsContent", "tabs"],
    ["TabsList", "tabs"],
    ["TabsTrigger", "tabs"],
    ["Accordion", "accordion"],
    ["AccordionContent", "accordion"],
    ["AccordionItem", "accordion"],
    ["AccordionTrigger", "accordion"],
    ["Collapsible", "collapsible"],
    ["CollapsibleContent", "collapsible"],
    ["CollapsibleTrigger", "collapsible"],

    // Overlays & Dialogs
    ["Dialog", "dialog"],
    ["DialogContent", "dialog"],
    ["DialogDescription", "dialog"],
    ["DialogHeader", "dialog"],
    ["DialogTitle", "dialog"],
    ["DialogTrigger", "dialog"],
    ["DialogFooter", "dialog"],
    ["Sheet", "sheet"],
    ["SheetContent", "sheet"],
    ["SheetDescription", "sheet"],
    ["SheetHeader", "sheet"],
    ["SheetTitle", "sheet"],
    ["SheetTrigger", "sheet"],
    ["AlertDialog", "alert-dialog"],
    ["AlertDialogAction", "alert-dialog"],
    ["AlertDialogCancel", "alert-dialog"],
    ["AlertDialogContent", "alert-dialog"],
    ["AlertDialogDescription", "alert-dialog"],
    ["AlertDialogFooter", "alert-dialog"],
    ["AlertDialogHeader", "alert-dialog"],
    ["AlertDialogTitle", "alert-dialog"],
    ["AlertDialogTrigger", "alert-dialog"],
    ["Popover", "popover"],
    ["PopoverContent", "popover"],
    ["PopoverTrigger", "popover"],
    ["HoverCard", "hover-card"],
    ["HoverCardContent", "hover-card"],
    ["HoverCardTrigger", "hover-card"],
    ["Tooltip", "tooltip"],
    ["TooltipContent", "tooltip"],
    ["TooltipProvider", "tooltip"],
    ["TooltipTrigger", "tooltip"],

    // Feedback & Display
    ["Alert", "alert"],
    ["AlertDescription", "alert"],
    ["AlertTitle", "alert"],
    ["Badge", "badge"],
    ["Avatar", "avatar"],
    ["AvatarFallback", "avatar"],
    ["AvatarImage", "avatar"],
    ["Progress", "progress"],
    ["Skeleton", "skeleton"],
    ["Sonner", "sonner"],
  ]);

  const filesToInstall = new Set<string>();
  missingComponents.forEach((comp) => {
    const file = componentToFile.get(comp);
    if (file) {
      filesToInstall.add(file);
    }
  });

  if (filesToInstall.size === 0) {
    return true;
  }

  // For now, we'll just notify the user
  // In a real implementation, you'd need a backend endpoint to run the install commands
  const files = Array.from(filesToInstall);

  toast.info(`Missing ${files.length} component file(s)`, {
    description: `Please run: bunx shadcn@latest add ${files.join(" ")}`,
    duration: 10000,
  });

  // Copy install command to clipboard
  const command = `bunx shadcn@latest add ${files.join(" ")}`;
  try {
    await navigator.clipboard.writeText(command);
    toast.success("Install command copied to clipboard!", {
      description: "Paste in your terminal to install missing components",
    });
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
  }

  return false;
}

/**
 * Suggests fixes for missing imports in the code
 */
export function suggestImportFixes(
  code: string,
  missingComponents: string[],
): string {
  // Reuse the same comprehensive mapping
  const componentToFile = new Map<string, string>([
    ["Card", "card"],
    ["CardContent", "card"],
    ["CardDescription", "card"],
    ["CardFooter", "card"],
    ["CardHeader", "card"],
    ["CardTitle", "card"],
    ["Separator", "separator"],
    ["ScrollArea", "scroll-area"],
    ["AspectRatio", "aspect-ratio"],
    ["Button", "button"],
    ["Toggle", "toggle"],
    ["ToggleGroup", "toggle-group"],
    ["ToggleGroupItem", "toggle-group"],
    ["Switch", "switch"],
    ["Input", "input"],
    ["Textarea", "textarea"],
    ["Checkbox", "checkbox"],
    ["Label", "label"],
    ["RadioGroup", "radio-group"],
    ["RadioGroupItem", "radio-group"],
    ["Select", "select"],
    ["SelectContent", "select"],
    ["SelectItem", "select"],
    ["SelectTrigger", "select"],
    ["SelectValue", "select"],
    ["SelectGroup", "select"],
    ["SelectLabel", "select"],
    ["Slider", "slider"],
    ["NavigationMenu", "navigation-menu"],
    ["NavigationMenuContent", "navigation-menu"],
    ["NavigationMenuItem", "navigation-menu"],
    ["NavigationMenuLink", "navigation-menu"],
    ["NavigationMenuList", "navigation-menu"],
    ["NavigationMenuTrigger", "navigation-menu"],
    ["Menubar", "menubar"],
    ["MenubarMenu", "menubar"],
    ["MenubarTrigger", "menubar"],
    ["MenubarContent", "menubar"],
    ["MenubarItem", "menubar"],
    ["DropdownMenu", "dropdown-menu"],
    ["DropdownMenuContent", "dropdown-menu"],
    ["DropdownMenuItem", "dropdown-menu"],
    ["DropdownMenuLabel", "dropdown-menu"],
    ["DropdownMenuSeparator", "dropdown-menu"],
    ["DropdownMenuTrigger", "dropdown-menu"],
    ["ContextMenu", "context-menu"],
    ["ContextMenuContent", "context-menu"],
    ["ContextMenuItem", "context-menu"],
    ["ContextMenuTrigger", "context-menu"],
    ["Tabs", "tabs"],
    ["TabsContent", "tabs"],
    ["TabsList", "tabs"],
    ["TabsTrigger", "tabs"],
    ["Accordion", "accordion"],
    ["AccordionContent", "accordion"],
    ["AccordionItem", "accordion"],
    ["AccordionTrigger", "accordion"],
    ["Collapsible", "collapsible"],
    ["CollapsibleContent", "collapsible"],
    ["CollapsibleTrigger", "collapsible"],
    ["Dialog", "dialog"],
    ["DialogContent", "dialog"],
    ["DialogDescription", "dialog"],
    ["DialogHeader", "dialog"],
    ["DialogTitle", "dialog"],
    ["DialogTrigger", "dialog"],
    ["DialogFooter", "dialog"],
    ["Sheet", "sheet"],
    ["SheetContent", "sheet"],
    ["SheetDescription", "sheet"],
    ["SheetHeader", "sheet"],
    ["SheetTitle", "sheet"],
    ["SheetTrigger", "sheet"],
    ["AlertDialog", "alert-dialog"],
    ["AlertDialogAction", "alert-dialog"],
    ["AlertDialogCancel", "alert-dialog"],
    ["AlertDialogContent", "alert-dialog"],
    ["AlertDialogDescription", "alert-dialog"],
    ["AlertDialogFooter", "alert-dialog"],
    ["AlertDialogHeader", "alert-dialog"],
    ["AlertDialogTitle", "alert-dialog"],
    ["AlertDialogTrigger", "alert-dialog"],
    ["Popover", "popover"],
    ["PopoverContent", "popover"],
    ["PopoverTrigger", "popover"],
    ["HoverCard", "hover-card"],
    ["HoverCardContent", "hover-card"],
    ["HoverCardTrigger", "hover-card"],
    ["Tooltip", "tooltip"],
    ["TooltipContent", "tooltip"],
    ["TooltipProvider", "tooltip"],
    ["TooltipTrigger", "tooltip"],
    ["Alert", "alert"],
    ["AlertDescription", "alert"],
    ["AlertTitle", "alert"],
    ["Badge", "badge"],
    ["Avatar", "avatar"],
    ["AvatarFallback", "avatar"],
    ["AvatarImage", "avatar"],
    ["Progress", "progress"],
    ["Skeleton", "skeleton"],
  ]);

  // Group missing components by their file
  const fileToComponents = new Map<string, string[]>();
  missingComponents.forEach((comp) => {
    const file = componentToFile.get(comp);
    if (file) {
      if (!fileToComponents.has(file)) {
        fileToComponents.set(file, []);
      }
      fileToComponents.get(file)!.push(comp);
    }
  });

  // Generate import statements
  let imports = "";
  fileToComponents.forEach((components, file) => {
    imports += `import { ${components.join(", ")} } from "@/components/ui/${file}"\n`;
  });

  // Find the first import or export statement
  const firstImportMatch = code.match(/^import /m);
  const firstExportMatch = code.match(/^export /m);

  if (firstImportMatch) {
    // Add before first import
    const index = code.indexOf(firstImportMatch[0]);
    return imports + code.slice(index);
  } else if (firstExportMatch) {
    // Add before first export
    const index = code.indexOf(firstExportMatch[0]);
    return imports + "\n" + code.slice(index);
  } else {
    // Add at the beginning
    return imports + "\n" + code;
  }
}

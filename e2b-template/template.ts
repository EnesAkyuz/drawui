import { Template } from "e2b";

export const template = Template()
  .fromBaseImage()
  .setWorkdir("/home/user/app")
  .aptInstall(["curl", "git"])
  // Copy all project files
  .copyItems([
    { src: "files/package.json", dest: "/home/user/app/package.json" },
    { src: "files/next.config.js", dest: "/home/user/app/next.config.js" },
    { src: "files/tsconfig.json", dest: "/home/user/app/tsconfig.json" },
    {
      src: "files/tailwind.config.js",
      dest: "/home/user/app/tailwind.config.js",
    },
    {
      src: "files/postcss.config.js",
      dest: "/home/user/app/postcss.config.js",
    },
    { src: "files/components.json", dest: "/home/user/app/components.json" },
    { src: "files/app/", dest: "/home/user/app/app/" },
    { src: "files/lib/", dest: "/home/user/app/lib/" },
  ])
  // Install dependencies
  .runCmd("npm install")
  // Skip shadcn init since components.json already exists
  // Just add shadcn components directly
  .runCmd(
    "npx shadcn@latest add button card input label textarea badge avatar dialog sheet tabs accordion alert separator scroll-area skeleton select switch checkbox radio-group dropdown-menu popover --yes",
  );

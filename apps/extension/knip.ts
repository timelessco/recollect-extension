import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/entrypoints/popup/main.tsx",
    "wxt.config.ts",
    "src/assets/tailwind.css",
  ],
  ignore: ["src/components/ui/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
  ignoreDependencies: [
    "@repo/shadcn-ui", // Workspace package with deep imports
    "@wxt-dev/module-react",
    "lucide-react",
    "vite", // vite/client types referenced in env.d.ts
  ],
  ignoreExportsUsedInFile: { interface: true, type: true },
  project: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
  treatConfigHintsAsErrors: true,
};

export default config;

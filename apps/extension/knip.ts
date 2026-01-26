import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/entrypoints/popup/main.tsx",
    "wxt.config.ts",
    "src/assets/tailwind.css",
  ],
  ignore: ["src/components/ui/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
  ignoreDependencies: [
    "@wxt-dev/module-react",
    "lint-staged",
    "lucide-react",
    "oxfmt",
    "oxlint-tsgolint",
  ],
  ignoreExportsUsedInFile: { interface: true, type: true },
  project: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
  treatConfigHintsAsErrors: true,
};

export default config;

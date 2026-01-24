import { type Config } from "release-it";

export default {
  git: {
    commitArgs: ["--no-verify", "-S"],
    commitMessage: "chore: 🚀 release v${version}",
    requireBranch: "main",
    requireCleanWorkingDir: false,
    requireCommits: true,
    tagArgs: ["-s"],
  },
  github: {
    comments: { submit: true },
    release: true,
    releaseName: "v${version}",
  },
  hooks: { "before:init": ["bun check"] },
  npm: { publish: false },
  plugins: {
    "@release-it/conventional-changelog": {
      infile: "CHANGELOG.md",
      preset: {
        name: "conventionalcommits",
        types: [
          { section: "Features", type: "feat", hidden: false },
          { section: "Bug Fixes", type: "fix", hidden: false },
          { section: "Documentation", type: "docs", hidden: false },
          { section: "Styles", type: "style", hidden: false },
          { section: "Code Refactoring", type: "refactor", hidden: false },
          { section: "Performance Improvements", type: "perf", hidden: false },
          { section: "Tests", type: "test", hidden: false },
          { section: "Builds", type: "build", hidden: false },
          { section: "Continuous Integration", type: "ci", hidden: false },
          { section: "Chores", type: "chore", hidden: false },
          { section: "Reverts", type: "revert", hidden: false },
        ],
      },
    },
  },
} satisfies Config;

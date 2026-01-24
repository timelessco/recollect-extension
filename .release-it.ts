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
      preset: "conventionalcommits",
      types: [
        { section: "Features", type: "feat" },
        { section: "Bug Fixes", type: "fix" },
        { section: "Documentation", type: "docs" },
        { section: "Styles", type: "style" },
        { section: "Code Refactoring", type: "refactor" },
        { section: "Performance Improvements", type: "perf" },
        { section: "Tests", type: "test" },
        { section: "Builds", type: "build" },
        { section: "Continuous Integration", type: "ci" },
        { section: "Chores", type: "chore" },
        { section: "Reverts", type: "revert" },
      ],
    },
  },
} satisfies Config;

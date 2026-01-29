# Changelog

## 0.2.3

### Patch Changes

- Updated dependencies [[`ead60ee`](https://github.com/timelessco/recollect-extension/commit/ead60ee9913931dfe6e90a09d4ea191c7490e863)]:
  - @repo/shadcn-ui@0.0.3

## 0.2.2

### Patch Changes

- Updated dependencies [[`5e76ade`](https://github.com/timelessco/recollect-extension/commit/5e76ade1af422a146577ef4b0dc99a586fd1b8b0)]:
  - @repo/shadcn-ui@0.0.2

## 0.2.1

### Patch Changes

- [`bae62fd`](https://github.com/timelessco/recollect-extension/commit/bae62fd8df5f1a8cbaa10e9765f9950851105d29) Thanks [@navin-moorthy](https://github.com/navin-moorthy)! - test release workflow

- Updated dependencies [[`ae9da2d`](https://github.com/timelessco/recollect-extension/commit/ae9da2d781e4c60b40bfbfab506b407408e0e87e)]:
  - @repo/shadcn-ui@0.0.1

## [0.2.0](https://github.com/timelessco/recollect-extension/compare/0.1.2...0.2.0) (2026-01-24)

### Features

- **01-01:** add environment configuration system ([f6b2a97](https://github.com/timelessco/recollect-extension/commit/f6b2a97f9aa23fefa6234d30f970b617f489d3fc))
- **01-01:** configure manifest cookies permission ([fc6c4c8](https://github.com/timelessco/recollect-extension/commit/fc6c4c8d34eaf301a1fc3deecbdd13c810840270))
- **02-01:** add auth utility modules for types, JWT, and cookies ([6228ea5](https://github.com/timelessco/recollect-extension/commit/6228ea57b29cba80f2cb6ba5173f1bcc0c15117a))
- **02-01:** add main auth API with checkAuthState and getAuthDebugInfo ([db5c05b](https://github.com/timelessco/recollect-extension/commit/db5c05b7e9ab9b2213e65f860c13ec233b45debf))
- **03-01:** add popup view components for auth states ([9857166](https://github.com/timelessco/recollect-extension/commit/985716631cd8664233d14f060af086efa93d77c3))
- **03-01:** add UI primitives and React pattern libraries ([fb01dae](https://github.com/timelessco/recollect-extension/commit/fb01daeba8677e5b630ad021aff14dcb50469ccd))
- **03-02:** integrate auth state with popup UI ([5e2dec2](https://github.com/timelessco/recollect-extension/commit/5e2dec22a90e2b5a40435428e6250ab11f087e2b))

### Bug Fixes

- **03-02:** verification fixes for popup UI and auth detection ([818f975](https://github.com/timelessco/recollect-extension/commit/818f97525ae01c1b4df7a5ffdcbe2a5d9e152655))
- **04-01:** use all_urls permission for bookmark functionality ([f9bf0e8](https://github.com/timelessco/recollect-extension/commit/f9bf0e85e4b895e865f48843bf47f93d03dc53d3))

### Documentation

- **04-01:** add verification checklist for extension builds ([89dd47c](https://github.com/timelessco/recollect-extension/commit/89dd47c8edf52416ab8c81be3f77af866e90a428))
- **04-01:** update verification checklist for all_urls permission ([f928195](https://github.com/timelessco/recollect-extension/commit/f9281955e3a2fdbf657c5d75e666bd4ddf10c640))
- rename verification.md to VERIFICATION.md ([f87e7a9](https://github.com/timelessco/recollect-extension/commit/f87e7a9d9604d571706123eea7caeab55a30c73c))

### Code Refactoring

- **auth:** merge getAuthDebugInfo into saveDebugLog ([e10589d](https://github.com/timelessco/recollect-extension/commit/e10589d9b92b8cb6da6225f8f2d00a83909e357d))

## [0.1.2](https://github.com/timelessco/recollect-extension/compare/0.1.1...0.1.2) (2026-01-24)

### Chores

- **config:** 🧹 remove obsolete oxfmt configuration file ([3f2e832](https://github.com/timelessco/recollect-extension/commit/3f2e832d178b90cb193da6e4478ec75c06452afc))

## [0.1.1](https://github.com/timelessco/recollect-extension/compare/0.1.0...0.1.1) (2026-01-24)

### Styles

- **config:** 💄 format code and improve consistency ([3f52818](https://github.com/timelessco/recollect-extension/commit/3f52818e581676165d2f07f0652bd37f5f058991))

## 0.1.0 (2026-01-24)

### Features

- **styles:** ✨ integrate shadcn and update Tailwind styles ([3fdc166](https://github.com/timelessco/recollect-extension/commit/3fdc166a96053a79d4441e4a9caef29fd0ef815e))

### Bug Fixes

- resolve ultracite lint errors and configure oxlint ([4e018aa](https://github.com/timelessco/recollect-extension/commit/4e018aad73116f92d5055faefd50d12922c5b355))

### Documentation

- initialize project ([bcfdda6](https://github.com/timelessco/recollect-extension/commit/bcfdda6b541d16b427a6c5a73c47458ed75e083d))
- **oss:** 📝 add open source governance files ([6243dbb](https://github.com/timelessco/recollect-extension/commit/6243dbbc802cf9481c847940f28b65d3a7a107b8))
- **readme:** 📝 update instructions for bun ([d491d41](https://github.com/timelessco/recollect-extension/commit/d491d41d9736f2f164785e56e9d9127cac1debc8))

### Styles

- **imports:** 💄 fix import formatting in configuration files ([265ce0f](https://github.com/timelessco/recollect-extension/commit/265ce0f41bf7a1fafbd644be6c781781210e835a))
- **tailwind:** 💄 add optimize-legibility utility ([1bacab4](https://github.com/timelessco/recollect-extension/commit/1bacab4df3768fec7631bc37d79e064ccdeb6a51))
- **tailwind:** 💄 fix spacing in utility classes ([2d14d20](https://github.com/timelessco/recollect-extension/commit/2d14d204ec875aa6197883269d8cd60ff8d408a6))

### Code Refactoring

- **popup:** ♻️ use named export for popup client ([12bcf92](https://github.com/timelessco/recollect-extension/commit/12bcf92ce28015219ac99a485c9c4a2e33d44128))
- rename App.tsx to app.tsx (kebab-case) ([7a8d81d](https://github.com/timelessco/recollect-extension/commit/7a8d81d86a7ed8587a5eb4733c66b8c09495ce6f))

### Builds

- **deps:** 📦 migrate from pnpm to bun ([fb8dcf8](https://github.com/timelessco/recollect-extension/commit/fb8dcf888afb8047d50cac68bb701a4fcf5265c0))

### Chores

- **config:** 🧹 add configuration files for project setup ([975f17a](https://github.com/timelessco/recollect-extension/commit/975f17a7ba33f2eb92b6c9c16209f811a666bb87))
- **init:** 🎉 bootstrap WXT extension ([ee7b8ff](https://github.com/timelessco/recollect-extension/commit/ee7b8ff41091482f009195a01f9d7f486e36c036))
- **lint:** 🔧 update linter config for bun and stricter rules ([2d6b308](https://github.com/timelessco/recollect-extension/commit/2d6b3086a808151837e37700e9612b9fefee6d4d))
- **tooling:** 🔧 add editor config, knip, and release automation ([83a9633](https://github.com/timelessco/recollect-extension/commit/83a963387fa44b586dc14dd36286b233f1ffe6b4))

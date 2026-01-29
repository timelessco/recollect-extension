# Development

## Prerequisites

- **[Git](https://git-scm.com/)**
- **[pnpm](https://pnpm.io/)** (see `packageManager` in package.json for version)

## Getting Started

```shell
git clone https://github.com/timelessco/recollect-extension
cd recollect-extension
pnpm install
```

## Development

```bash
pnpm dev
```

Starts the WXT development server with hot reload via Turborepo.

## Building

```bash
pnpm build
```

Builds all packages. Extension output is in `apps/extension/.output/chrome-mv3/`.

## Linting & Formatting

Check for issues:

```bash
pnpm check
```

Auto-fix issues:

```bash
pnpm fix
```

## Release

Build and create extension ZIP:

```bash
pnpm release
```

# Development

## Prerequisites

- **[Git](https://git-scm.com/)**
- **[Bun](https://bun.sh/)** (see `packageManager` in package.json for version)

## Getting Started

```shell
git clone https://github.com/timelessco/recollect-extension
cd recollect-extension
bun install
```

## Development

```bash
bun dev
```

This starts the WXT development server with hot reload.

## Building

```bash
bun run build
```

Builds the extension for Chrome. Output is in `.output/chrome-mv3/`.

For Firefox:

```bash
bun run build:firefox
```

## Linting & Formatting

Check for issues:

```bash
bun run check
```

Auto-fix issues:

```bash
bun run fix
```

## Unused Dependencies & Exports

Check for unused dependencies, exports, and types:

```bash
bun run knip
```

## Creating Extension ZIP

```bash
bun run zip
```

For Firefox:

```bash
bun run zip:firefox
```

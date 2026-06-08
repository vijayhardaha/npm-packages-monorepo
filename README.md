# npm-packages-monorepo

Monorepo for publishing npm packages.

## Packages

| Package                                                         | Description                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`@vijayhardaha/annotate-returns`](./packages/annotate-returns) | Add missing TypeScript return type annotations from JSDoc `@returns` tags |

## Setup

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun run test

# Lint & format
bun run lint
bun run format
```

## Adding a new package

1. Create a directory in `packages/`
2. Add its own `package.json`, `tsconfig.json`, and source files
3. Run `bun install` from root to link workspace dependencies

# AGENTS.md — schema-builder

## Overview

`@vijayhardaha/schema-builder` provides reusable Schema.org structured data utilities, types, and React components with full TypeScript support.

This package is part of the `npm-packages-monorepo` monorepo.

## Quick Start

```bash
cd packages/schema-builder
bun install
bun run build     # builds dist/
bun run test      # runs vitest
bun run tsc       # type-check
```

## Project Structure

```bash
src/
├── components/
│   └── JsonLd.tsx              # React component for JSON-LD script tags
├── constants/
│   ├── creator.ts               # CREATOR constant with profile data
│   └── index.ts
├── schemas/
│   ├── breadCrumb.ts            # + breadCrumb.test.ts
│   ├── blogPosting.ts           # + blogPosting.test.ts
│   ├── collectionPage.ts        # + collectionPage.test.ts
│   ├── organization.ts          # + organization.test.ts
│   ├── person.ts                # + person.test.ts
│   ├── softwareApp.ts           # + softwareApp.test.ts
│   ├── webApi.ts                # + webApi.test.ts
│   ├── webPage.ts               # webpageSchema, aboutPageSchema, contactPageSchema + webPage.test.ts
│   ├── webSite.ts               # + webSite.test.ts
│   └── index.ts
├── utils/
│   ├── merge.ts                 # SchemaEntity, deepMerge, mergeWithType + merge.test.ts
│   ├── schema.ts                # buildId, toGraph + schema.test.ts
│   ├── url.ts                   # validateUrl, resolveUrl, cleanUrl + url.test.ts
│   └── index.ts
├── index.ts                     # Main entry (re-exports schemas, constants, utils)
└── react.tsx                   # React entry (exports JsonLd component)
dist/
  index.js       → Core entry (built by vite)
  react.js       → React entry (built by vite)
```

## Conventions

### Naming

- Components: `PascalCase` (`JsonLd.tsx`)
- Functions: `camelCase` (`personSchema`)
- Files: `camelCase` (`deepMerge.ts`)
- Types/Interfaces: `PascalCase` (`PersonOptions`)

### Schema Functions

Each schema function follows this pattern:

```typescript
import type { Person } from "schema-dts";

import { mergeWithType, validateUrl } from "@/utils";

export type PersonOptions = { rootUrl: string };

export function personSchema(options: PersonOptions, overrides?: Partial<Person>): Person {
  const rootUrl = validateUrl(options.rootUrl);

  const schema: Person = {
    "@type": "Person"
    // ... build schema using schema-dts types
  };

  return mergeWithType(schema, overrides);
}
```

### Key Guidelines

1. **Use schema-dts types** - All schema functions should use schema-dts types for type safety
2. **Validate `rootUrl`** - Always validate with `validateUrl()` first
3. **Two parameters max** - `options` and `optional overrides`
4. **`@type` is final** - Override parameter should not change the schema type
5. **Co-locate tests** - Test files next to source files (`person.test.ts` next to `person.ts`)
6. **Types in same file** - Related types defined in the same file as their functions

## Available Commands

```bash
# Development
bun run dev          # Start development server
bun run build        # Build for production

# Testing
bun run test         # Run tests (Vitest)
bun run test:watch   # Run tests in watch mode
bun run test:coverage # Generate coverage report

# Linting & Formatting
bun run lint         # Lint all files
bun run lint:fix     # Fix auto-fixable issues
bun run format       # Format files
bun run format:check # Check formatting
```

## Validation

All inputs are validated:

- `rootUrl` - Must be a valid HTTP(S) URL, throws error if empty/null/undefined/invalid
- Use `validateUrl()` utility from `@/utils/url`

## Schema Types

The package provides the following schema types:

| Function               | Schema.org Type     |
| ---------------------- | ------------------- |
| `personSchema`         | Person              |
| `organizationSchema`   | Organization        |
| `webSiteSchema`        | WebSite             |
| `webpageSchema`        | WebPage             |
| `aboutPageSchema`      | AboutPage           |
| `contactPageSchema`    | ContactPage         |
| `collectionPageSchema` | CollectionPage      |
| `blogPostingSchema`    | BlogPosting         |
| `webAppSchema`         | WebApplication      |
| `webApiSchema`         | WebAPI              |
| `softwareAppSchema`    | SoftwareApplication |
| `breadcrumbSchema`     | BreadcrumbList      |

## Utilities

| File        | Function          | Description                                |
| ----------- | ----------------- | ------------------------------------------ |
| `url.ts`    | `validateUrl()`   | Validates HTTP(S) URLs, throws on invalid  |
| `url.ts`    | `resolveUrl()`    | Resolves URL with path                     |
| `url.ts`    | `cleanUrl()`      | Cleans URL (trailing slash, query strings) |
| `merge.ts`  | `deepMerge()`     | Recursively merges objects                 |
| `merge.ts`  | `mergeWithType()` | Merges while preserving `@type`            |
| `merge.ts`  | `SchemaEntity`    | Type alias for `Record<string, unknown>`   |
| `schema.ts` | `toGraph()`       | Wraps entities in `@graph` structure       |
| `schema.ts` | `buildId()`       | Builds schema ID from URL and fragment     |

## React Components

### JsonLd

Renders a JSON-LD script tag with XSS protection.

```tsx
import JsonLd from "@vijayhardaha/schema-builder/react";

<JsonLd data={[personSchema(options), webSiteSchema(options)]} />;
```

## Build Configuration

The package uses Vite with multi-entry points:

- `src/index.ts` → `dist/index.js` (core utilities and schemas)
- `src/react.tsx` → `dist/react.js` (React components)

Output is ESM only. Declaration files (`.d.ts`) are generated by `vite-plugin-dts`.

## Coding Taste

### JSDoc Conventions

- **Functions & Methods**: Include a meaningful summary, a blank line, `@param` tags grouped together, a blank line, and an `@returns` tag (if returning a meaningful value).
- **Private helpers**: Internal helper functions are documented with JSDoc for maintainability.
- **Constants**: Use a simple single-line summary block (`/** Description. */`). No tags or blank lines.
- **Test Files**: Test files must start with a `/** ... */` block comment detailing what the test covers.

### Coding Style

- Write functional, explicit code with clear, descriptive names.
- Ensure 100% line coverage including branches where practical.
- Use early returns and minimal nesting.
- Extract complex logic into focused helpers.

## Release Process

```bash
cd packages/schema-builder
bun run release
```

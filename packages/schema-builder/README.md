# @vijayhardaha/schema-builder

Reusable Schema.org structured data utilities, types, and React components with full TypeScript support.

[![npm version](https://img.shields.io/npm/v/@vijayhardaha/schema-builder.svg)](https://www.npmjs.com/package/@vijayhardaha/schema-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## Features

- Full TypeScript support with strict mode
- Type-safe Schema.org types using [schema-dts](https://github.com/google/schema-dts)
- React components for JSON-LD script tags
- Utility functions for merging and validating schemas
- Comprehensive test coverage
- [100% test coverage](CHANGELOG.md)

## Installation

```bash
bun add @vijayhardaha/schema-builder
```

## Usage

### JavaScript/TypeScript

```typescript
import { personSchema, webSiteSchema, toGraph } from "@vijayhardaha/schema-builder";

const person = personSchema({ rootUrl: "https://example.com" });
const website = webSiteSchema({ rootUrl: "https://example.com" });

// Use toGraph() to wrap multiple entities
const graph = toGraph(person, website);
```

### React

```tsx
import JsonLd from "@vijayhardaha/schema-builder/react";
import { personSchema, webSiteSchema } from "@vijayhardaha/schema-builder";

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <JsonLd
        data={[personSchema({ rootUrl: "https://example.com" }), webSiteSchema({ rootUrl: "https://example.com" })]}
      />
    </div>
  );
}
```

## API Reference

### Schema Functions

| Function               | Schema.org Type     | Description                        |
| ---------------------- | ------------------- | ---------------------------------- |
| `personSchema`         | Person              | Person entity with creator profile |
| `organizationSchema`   | Organization        | Organization linked to creator     |
| `webSiteSchema`        | WebSite             | Website with search action         |
| `webpageSchema`        | WebPage             | General web page                   |
| `aboutPageSchema`      | AboutPage           | About page                         |
| `contactPageSchema`    | ContactPage         | Contact page                       |
| `collectionPageSchema` | CollectionPage      | Collection or listing page         |
| `blogPostingSchema`    | BlogPosting         | Blog post or article               |
| `webApiSchema`         | WebAPI              | WebAPI with pricing and platform   |
| `softwareAppSchema`    | SoftwareApplication | Software application with pricing  |
| `breadcrumbSchema`     | BreadcrumbList      | Navigation breadcrumb list         |

### Utilities

| Function                           | Description                                        |
| ---------------------------------- | -------------------------------------------------- |
| `validateUrl(url)`                 | Validates HTTP(S) URLs, throws on invalid input    |
| `resolveUrl(root, path)`           | Resolves URL with path                             |
| `cleanUrl(url, trailingSlash)`     | Cleans URL (removes trailing slash, query strings) |
| `deepMerge(target, overrides)`     | Recursively merges two objects                     |
| `mergeWithType(target, overrides)` | Merges objects while preserving `@type`            |
| `toGraph(...entities)`             | Wraps entities in `@graph` structure               |
| `buildId(url, fragment)`           | Builds schema ID from URL and fragment             |

### React Components

| Component | Description                                    |
| --------- | ---------------------------------------------- |
| `JsonLd`  | Renders JSON-LD script tag with XSS protection |

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for all changes.

## License

[MIT](LICENSE) - Copyright (c) Vijay Hardaha

## Author

[Vijay Hardaha](https://github.com/vijayhardaha)

## Issues

Report issues at https://github.com/vijayhardaha/npm-packages-monorepo/issues

# @vijayhardaha/annotate-returns

Automatically add missing TypeScript return type annotations from JSDoc `@returns` tags.

**Problem**: You have well-documented TypeScript code with `@returns {Type}` JSDoc tags, but you're missing the actual return type annotations on functions.

**Solution**: `annotate-returns` scans your source files, reads the `@returns` JSDoc tags, and adds the correct return type annotations automatically.

## Install

```bash
npm install @vijayhardaha/annotate-returns
# or
bun add @vijayhardaha/annotate-returns
```

## Usage

### CLI

```bash
# Scan default patterns (src/**/*.ts, src/**/*.tsx)
npx annotate-returns

# Scan specific files or directories
npx annotate-returns src/
npx annotate-returns "src/**/*.ts"
npx annotate-returns src/foo.ts src/bar.ts

# Preview changes without writing
npx annotate-returns -d

# Fail CI if annotations are missing
npx annotate-returns --check

# Exclude certain patterns
npx annotate-returns --exclude "dist/**" --exclude "**/*.test.ts"

# Use a custom tsconfig
npx annotate-returns --tsconfig tsconfig.build.json

# JSON output for CI pipelines
npx annotate-returns --json

# Create .bak files before modifying
npx annotate-returns --backup
```

### Options

| Option                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `-v, --verbose`        | Show every file and function processed           |
| `-q, --quiet`          | Only show errors and summary                     |
| `-d, --dry-run`        | Preview changes without writing files            |
| `--check`              | Exit with code 1 if missing return types found   |
| `--json`               | Output machine-readable JSON                     |
| `--tsconfig <path>`    | Path to tsconfig.json (default: `tsconfig.json`) |
| `--include <globs...>` | Include files matching glob(s)                   |
| `--exclude <globs...>` | Exclude files matching glob(s)                   |
| `--backup`             | Create `.bak` files before modifications         |
| `-h, --help`           | Show help                                        |
| `--version`            | Show version                                     |

### Programmatic API

```typescript
import { annotate } from "@vijayhardaha/annotate-returns";

const result = await annotate({
  include: ["src/**/*.ts"],
  exclude: ["dist/**"],
  dryRun: true // preview only
});

console.log(`Would update ${result.filesUpdated} files`);
```

#### `AnnotateOptions`

| Option     | Type       | Default                           | Description                                     |
| ---------- | ---------- | --------------------------------- | ----------------------------------------------- |
| `tsconfig` | `string`   | `"tsconfig.json"`                 | Path to tsconfig                                |
| `include`  | `string[]` | `["**/*.ts", "**/*.tsx"]`        | Include patterns                                |
| `exclude`  | `string[]` | `[]`                              | Exclude patterns                                |
| `dryRun`   | `boolean`  | `false`                           | Preview without writing                         |
| `check`    | `boolean`  | `false`                           | Exit with code 1 if annotations found           |
| `backup`   | `boolean`  | `false`                           | Create `.bak` copies before modifying           |

#### `AnnotateResult`

```typescript
interface AnnotateResult {
  filesProcessed: number;
  filesUpdated: number;
  filesFailed: number;
  typesAnnotated: number;
  durationMs: number;
  files: FileResult[];
}
```

## How It Works

1. Parses your TypeScript project using `ts-morph`
2. Finds all functions with a `@returns {Type}` JSDoc tag
3. Skips functions that already have an explicit return type
4. Adds the missing return type annotation
5. Saves the file (or previews with `--dry-run`)

### Before

```typescript
/**
 * Get a user by ID.
 * @returns {Promise<User>}
 */
export async function getUser(id: string) {
  return db.users.findById(id);
}
```

### After

```typescript
/**
 * Get a user by ID.
 * @returns {Promise<User>}
 */
export async function getUser(id: string): Promise<User> {
  return db.users.findById(id);
}
```

## CI Usage

```yaml
# .github/workflows/annotate-check.yml
name: Check return types
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx @vijayhardaha/annotate-returns --check --json
```

## License

MIT &copy; [Vijay Hardaha](https://github.com/vijayhardaha)

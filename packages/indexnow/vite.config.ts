/**
 * ========================================================================
 * Vite Configuration — next-indexnow CLI
 * ========================================================================
 * Builds the CLI and library as a Node.js ESM bundle for distribution.
 * Docs:    https://vitejs.dev/config/
 * ========================================================================
 */

import { builtinModules } from 'module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // Shorthand for src/ imports
  resolve: { alias: { '@': resolve(__dirname, 'src') } },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'node18',
    ssr: true,

    // CLI entry point — produces dist/cli.js
    lib: { entry: resolve(__dirname, 'src/bin/cli.ts'), name: 'next-indexnow', fileName: 'cli', formats: ['es'] },

    rollupOptions: {
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`), 'commander', 'xml2js'],
      output: { preserveModules: false, entryFileNames: '[name].js' },
    },
  },
});

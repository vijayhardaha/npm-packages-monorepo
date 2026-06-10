/**
 * ======================================================================
 * Vite Build Configuration
 * ======================================================================
 * Purpose: Configures library bundling, TypeScript declaration
 *          generation, and output formats for the schema package.
 * Docs:    https://vite.dev/config/
 * ======================================================================
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // ---- Module Resolution ----
  // Map @/* imports to the source directory for local modules
  resolve: { alias: { '@': resolve(__dirname, './src') } },

  // ---- Plugins ----
  // Generate declaration files from source and skip colocated tests
  plugins: [
    dts({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      beforeWriteFile: (filePath, content) => ({ filePath: filePath.replace('/dist/src/', '/dist/'), content }),
    }),
  ],

  // ---- Build Output ----
  build: {
    // Emit all library artifacts into the dist directory
    outDir: 'dist',

    // Clear previous build output before writing new files
    emptyOutDir: true,

    // Build both public entry points as flat ESM files
    lib: {
      // Expose the package core entry and the React entry
      entry: { index: resolve(__dirname, 'src/index.ts'), react: resolve(__dirname, 'src/react.tsx') },

      // Emit ESM output only for this library build
      formats: ['es'],

      // Keep each entry file name stable in dist
      fileName: (_format, entryName) => entryName + '.js',
    },

    // ---- Rollup Options ----
    rollupOptions: {
      // Keep React runtime dependencies external to the bundle
      external: ['react', 'react/jsx-runtime'],

      output: {
        // Bundle all modules into entry and shared chunks only
        preserveModules: false,

        // Map externals to globals for fallback environments
        globals: { react: 'React', 'react/jsx-runtime': 'jsx-runtime' },

        // Keep entry and chunk names stable in dist
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',

        // Group shared utility modules into a dedicated chunk
        manualChunks(id) {
          if (id.includes('/utils/')) {
            return 'utils';
          }
          return;
        },
      },
    },

    // Keep output readable for inspection and debugging
    minify: false,
  },
});

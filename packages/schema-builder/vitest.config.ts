/**
 * ======================================================================
 * Vitest Configuration
 * ======================================================================
 * Purpose: Defines test execution, coverage, and alias resolution for
 *          the schema package test suite.
 * Docs:    https://vitest.dev/config/
 * ======================================================================
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

export default defineConfig({
  // ---- Module Resolution ----
  // Map @/* imports to the src directory
  resolve: { alias: { '@': resolve(__dirname, './src') } },

  // ---- Test Runner ----
  test: {
    // Inject describe, it, expect as globals (no imports needed)
    globals: true,
    // Simulate browser DOM APIs via jsdom
    environment: 'jsdom',
    // Run shared setup before each test file
    setupFiles: ['./vitest.setup.ts'],
    // Match test files by convention
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],

    // ---- Coverage ----
    coverage: {
      // Use V8's built-in coverage for speed
      provider: 'v8',
      // Produce text summary, JSON data, and HTML report
      reporter: ['text', 'json', 'html'],
      // Skip non-source files from coverage metrics
      exclude: ['coverage/**', 'dist/**', '**/*.config.*', '**/*.d.ts', '**/index.ts', '**/JsonLd.tsx', '**/react.tsx'],
    },
  },
});

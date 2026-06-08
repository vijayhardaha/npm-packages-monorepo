/**
 * Tests for the output formatters with full branch coverage.
 *
 * Covers formatJson, printResults (normal / verbose / quiet paths),
 * and printDryRun (with and without annotations). Console methods are
 * spied on per-test to assert exact call arguments.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { formatJson, printDryRun, printResults } from '../formatters.ts';
import type { AnnotateResult } from '../types.ts';

/** Shared result fixture used across most test groups. */
const mockResult: AnnotateResult = {
  filesProcessed: 3,
  filesUpdated: 1,
  filesFailed: 1,
  typesAnnotated: 2,
  durationMs: 1500,
  files: [
    {
      filePath: 'src/foo.ts',
      updated: true,
      failed: false,
      annotations: [
        { name: 'greet', returnType: 'string' },
        { name: 'getUsers', returnType: 'Promise<User[]>' },
      ],
    },
    { filePath: 'src/bar.ts', updated: false, failed: false, annotations: [] },
    { filePath: 'src/baz.ts', updated: false, failed: true, error: 'Parse error', annotations: [] },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('formatJson', () => {
  it('should return valid JSON with all fields', () => {
    const json = JSON.parse(formatJson(mockResult));

    expect(json.filesProcessed).toBe(3);
    expect(json.filesUpdated).toBe(1);
    expect(json.filesFailed).toBe(1);
    expect(json.typesAnnotated).toBe(2);
    expect(json.durationMs).toBe(1500);
    expect(json.files).toHaveLength(3);
    expect(json.files[0].annotations).toHaveLength(2);
    expect(json.files[2].error).toBe('Parse error');
  });

  it('should handle empty result', () => {
    const empty: AnnotateResult = {
      filesProcessed: 0,
      filesUpdated: 0,
      filesFailed: 0,
      typesAnnotated: 0,
      durationMs: 0,
      files: [],
    };

    const json = JSON.parse(formatJson(empty));
    expect(json.filesProcessed).toBe(0);
    expect(json.files).toHaveLength(0);
  });
});

describe('printResults (normal mode)', () => {
  it('should print normal output (default mode)', () => {
    printResults(mockResult, {});

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('src/foo.ts'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2 annotations'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('baz.ts'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Parse error'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Files scanned'));
  });
});

describe('printResults (verbose mode)', () => {
  it('should print verbose output', () => {
    printResults(mockResult, { verbose: true });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('src/foo.ts'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Updated'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('greet'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('getUsers'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Parse error'));
  });

  it('should print verbose status for skipped and failed files', () => {
    printResults(mockResult, { verbose: true });

    // src/bar.ts is not updated — should appear as SKIPPED
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('SKIPPED'));

    // src/baz.ts failed — should appear as Failed
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Failed'));
  });
});

describe('printResults (quiet mode)', () => {
  it('should print only errors in quiet mode', () => {
    // Run quiet mode only — no prior normal-mode calls in this test
    printResults(mockResult, { quiet: true });

    // Quiet mode must NOT print the update line
    const logCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(logCalls).not.toContain(expect.stringContaining('src/foo.ts'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('baz.ts'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Files scanned'));
  });
});

describe('printResults (edge cases)', () => {
  it('should handle result with no updates and no errors', () => {
    const clean: AnnotateResult = {
      filesProcessed: 1,
      filesUpdated: 0,
      filesFailed: 0,
      typesAnnotated: 0,
      durationMs: 50,
      files: [{ filePath: 'src/clean.ts', updated: false, failed: false, annotations: [] }],
    };

    printResults(clean, {});
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Files scanned'));
  });

  it('should handle multiple errors in quiet mode', () => {
    const errResult: AnnotateResult = {
      filesProcessed: 2,
      filesUpdated: 0,
      filesFailed: 2,
      typesAnnotated: 0,
      durationMs: 100,
      files: [
        { filePath: 'src/a.ts', updated: false, failed: true, error: 'Syntax error', annotations: [] },
        { filePath: 'src/b.ts', updated: false, failed: true, error: 'Type error', annotations: [] },
      ],
    };

    printResults(errResult, { quiet: true });

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Syntax error'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Type error'));
  });
});

describe('printResults (error handling)', () => {
  it('should not call console.error for a failed file with no error message (normal mode)', () => {
    const noMsgResult: AnnotateResult = {
      filesProcessed: 1,
      filesUpdated: 0,
      filesFailed: 1,
      typesAnnotated: 0,
      durationMs: 10,
      files: [{ filePath: 'src/x.ts', updated: false, failed: true, annotations: [] }],
    };

    // clearAllMocks runs before each test, so this is a clean slate
    printResults(noMsgResult, {});

    // file.failed is true but file.error is undefined — error line must NOT be printed
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should not call console.error in quiet mode for a failed file with no error message', () => {
    const noMsgResult: AnnotateResult = {
      filesProcessed: 1,
      filesUpdated: 0,
      filesFailed: 1,
      typesAnnotated: 0,
      durationMs: 10,
      files: [{ filePath: 'src/x.ts', updated: false, failed: true, annotations: [] }],
    };

    printResults(noMsgResult, { quiet: true });
    expect(console.error).not.toHaveBeenCalled();
  });
});

describe('printSummary', () => {
  it('should include aggregate fields in output', () => {
    printResults(mockResult, {});

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('scanned'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('updated'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('failed'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('annotated'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Duration'));
  });
});

describe('printDryRun', () => {
  it('should print file paths and annotations', () => {
    printDryRun(mockResult);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('src/foo.ts'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('greet()'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('string'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('getUsers()'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Promise<User[]>'));
  });

  it('should print message when no annotations found', () => {
    const empty: AnnotateResult = {
      filesProcessed: 2,
      filesUpdated: 0,
      filesFailed: 0,
      typesAnnotated: 0,
      durationMs: 100,
      files: [
        { filePath: 'src/bar.ts', updated: false, failed: false, annotations: [] },
        { filePath: 'src/baz.ts', updated: false, failed: false, annotations: [] },
      ],
    };

    printDryRun(empty);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('All files already have'));
  });

  it('should print dry-run summary line', () => {
    printDryRun(mockResult);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Dry-run complete'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2 annotations'));
  });
});

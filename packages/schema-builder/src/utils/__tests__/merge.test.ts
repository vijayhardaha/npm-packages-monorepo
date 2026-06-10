import { describe, it, expect } from 'vitest';

import { deepMerge, mergeWithType } from '../merge';

// describe: Tests for deepMerge
describe('deepMerge', () => {
  // describe: basic merging behavior
  describe('basic merging', () => {
    // it: should merge two objects
    it('should merge two objects', () => {
      const base = { a: 1, b: 2 };
      const overrides = { b: 3, c: 4 };
      const result = deepMerge(base, overrides);
      // expect: merged values reflect overrides
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    // it: should return base when overrides is undefined
    it('should return base when overrides is undefined', () => {
      const base = { a: 1 };
      const result = deepMerge(base, undefined);
      // expect: original object returned when no overrides
      expect(result).toEqual({ a: 1 });
    });

    // it: should handle empty objects
    it('should handle empty objects', () => {
      const base = {};
      const overrides = {};
      const result = deepMerge(base, overrides);
      // expect: empty merge returns empty
      expect(result).toEqual({});
    });

    // it: should not mutate the original base
    it('should not mutate the original base', () => {
      const base = { a: { b: 1 } };
      const overrides = { a: { c: 2 } };
      const result = deepMerge(base, overrides);
      // expect: original base unchanged
      expect(base).toEqual({ a: { b: 1 } });
      expect(result).toEqual({ a: { b: 1, c: 2 } });
    });
  });

  // describe: nested and deep merging
  describe('nested merging', () => {
    // it: should deeply merge nested objects
    it('should deeply merge nested objects', () => {
      const base = { a: { b: 1, c: 2 } };
      const overrides = { a: { c: 3, d: 4 } };
      const result = deepMerge(base, overrides);
      // expect: nested keys are merged recursively
      expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
    });

    // it: should deeply merge multiple levels
    it('should deeply merge multiple levels', () => {
      const base = { a: { b: { c: 1, d: 2 } } };
      const overrides = { a: { b: { d: 3, e: 4 } } };
      const result = deepMerge(base, overrides);
      // expect: three levels deep merge
      expect(result).toEqual({ a: { b: { c: 1, d: 3, e: 4 } } });
    });
  });

  // describe: edge cases with null, arrays, and undefined
  describe('edge cases', () => {
    // it: should replace arrays, not merge them
    it('should replace arrays, not merge them', () => {
      const base = { a: [1, 2, 3] };
      const overrides = { a: [4, 5] };
      const result = deepMerge(base, overrides);
      // expect: arrays are replaced by overrides
      expect(result).toEqual({ a: [4, 5] });
    });

    // it: should skip undefined override values
    it('should skip undefined override values', () => {
      const base = { a: 1, b: 2 };
      const overrides = { b: undefined, c: 3 };
      const result = deepMerge(base, overrides);
      // expect: undefined values are skipped
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    // it: should handle null base value (replaces, not merges)
    it('should handle null base value', () => {
      const base = { a: null, b: 2 };
      const overrides = { a: { nested: true } };
      const result = deepMerge(base, overrides);
      // expect: null replaced by object, not merged
      expect(result).toEqual({ a: { nested: true }, b: 2 });
    });

    // it: should handle null override value (replaces)
    it('should handle null override value', () => {
      const base = { a: { nested: true }, b: 2 };
      const overrides = { a: null };
      const result = deepMerge(base, overrides);
      // expect: object replaced by null
      expect(result).toEqual({ a: null, b: 2 });
    });
  });
});

// describe: Tests for mergeWithType
describe('mergeWithType', () => {
  // it: should merge and preserve @type
  it('should merge and preserve @type', () => {
    const schema = { '@type': 'Person', name: 'John' };
    const overrides = { name: 'Jane', jobTitle: 'Developer' };
    const result = mergeWithType(schema, overrides);
    // expect: original @type preserved and other fields updated
    expect(result['@type']).toBe('Person');
    expect(result.name).toBe('Jane');
    expect(result.jobTitle).toBe('Developer');
  });

  // it: should not override @type from overrides
  it('should not override @type from overrides', () => {
    const schema = { '@type': 'Person', name: 'John' };
    const overrides = { '@type': 'Organization', name: 'Jane' };
    const result = mergeWithType(schema, overrides);
    // expect: @type from base schema remains unchanged
    expect(result['@type']).toBe('Person');
  });

  // it: should handle schema without @type
  it('should handle schema without @type', () => {
    const schema = { name: 'John', url: 'https://example.com' };
    const overrides = { description: 'A person' };
    const result = mergeWithType(schema, overrides);
    // expect: works fine without @type
    expect(result).toEqual({ name: 'John', url: 'https://example.com', description: 'A person' });
  });

  // it: should handle cleanup of undefined values
  it('should handle cleanup of undefined values', () => {
    const schema = { name: 'John', description: 'A person' };
    const result = mergeWithType(schema, undefined);
    // expect: creates object with own properties
    expect(Object.keys(result)).toContain('name');
  });
});

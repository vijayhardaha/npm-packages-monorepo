import { describe, it, expect } from 'vitest';

import { softwareAppSchema } from '../softwareApp';

// describe: Tests for softwareAppSchema
describe('softwareAppSchema', () => {
  // describe: core schema structure
  describe('core schema', () => {
    // it: should create a valid SoftwareApplication schema
    it('should create a valid SoftwareApplication schema', () => {
      const result = softwareAppSchema({ rootUrl: 'https://example.com', path: 'app' });
      // expect: verifies the returned @type is SoftwareApplication
      expect(result['@type']).toBe('SoftwareApplication');
    });
  });

  // describe: input validation
  describe('input validation', () => {
    // it: should throw error for invalid rootUrl
    it('should throw error for invalid rootUrl', () => {
      // expect: throws when rootUrl is empty
      expect(() => softwareAppSchema({ rootUrl: '', path: 'test' })).toThrow();
    });

    // it: should remove undefined fields from overrides
    it('should remove undefined fields from overrides', () => {
      const result = softwareAppSchema({ rootUrl: 'https://example.com', path: 'app' }, { version: undefined });
      // expect: undefined fields are removed
      expect((result as unknown as Record<string, unknown>).version).toBeUndefined();
    });
  });

  // describe: optional fields
  describe('optional fields', () => {
    // it: should include applicationSubCategory when provided
    it('should include applicationSubCategory when provided', () => {
      const result = softwareAppSchema({
        rootUrl: 'https://example.com',
        path: 'app',
        applicationSubCategory: 'Developer Tools',
      });
      // expect: applicationSubCategory is included
      expect((result as unknown as Record<string, unknown>).applicationSubCategory).toBe('Developer Tools');
    });

    // it: should include downloadUrl when provided
    it('should include downloadUrl when provided', () => {
      const result = softwareAppSchema({
        rootUrl: 'https://example.com',
        path: 'app',
        downloadUrl: 'https://example.com/download',
      });
      // expect: downloadUrl is included
      expect((result as unknown as Record<string, unknown>).downloadUrl).toBe('https://example.com/download');
    });

    // it: should include installUrl when provided
    it('should include installUrl when provided', () => {
      const result = softwareAppSchema({
        rootUrl: 'https://example.com',
        path: 'app',
        installUrl: 'https://example.com/install',
      });
      // expect: installUrl is included
      expect((result as unknown as Record<string, unknown>).installUrl).toBe('https://example.com/install');
    });

    // it: should include requirements when provided
    it('should include requirements when provided', () => {
      const result = softwareAppSchema({ rootUrl: 'https://example.com', path: 'app', requirements: 'Node.js 18+' });
      // expect: softwareRequirements is included
      expect((result as unknown as Record<string, unknown>).softwareRequirements).toBe('Node.js 18+');
    });

    // it: should include sourceCode when provided
    it('should include sourceCode when provided', () => {
      const result = softwareAppSchema({
        rootUrl: 'https://example.com',
        path: 'app',
        sourceCode: 'https://github.com/example/app',
      });
      // expect: isBasedOn is included
      expect((result as unknown as Record<string, unknown>).isBasedOn).toBe('https://github.com/example/app');
    });
  });
});

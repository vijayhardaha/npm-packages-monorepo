import { describe, it, expect } from 'vitest';

import { webApiSchema } from '../webApi';

// describe: Tests for webApiSchema
describe('webApiSchema', () => {
  // it: should create a valid WebAPI schema
  it('should create a valid WebAPI schema', () => {
    const result = webApiSchema({ rootUrl: 'https://example.com', path: 'app' });
    // expect: verifies returned @type is WebAPI
    expect(result['@type']).toBe('WebAPI');
  });

  // it: should throw error for invalid rootUrl
  it('should throw error for invalid rootUrl', () => {
    // expect: throws on invalid rootUrl
    expect(() => webApiSchema({ rootUrl: '', path: 'test' })).toThrow();
  });
});

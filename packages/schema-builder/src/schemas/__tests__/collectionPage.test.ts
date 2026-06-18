import { describe, it, expect } from 'vitest';

import { collectionPageSchema } from '../collectionPage';

// describe: Tests for collectionPageSchema
describe('collectionPageSchema', () => {
  // it: should create a valid CollectionPage schema
  it('should create a valid CollectionPage schema', () => {
    const result = collectionPageSchema({ rootUrl: 'https://example.com', path: 'collections' });
    // expect: returned schema has type CollectionPage
    expect(result['@type']).toBe('CollectionPage');
  });

  // it: should throw error for invalid rootUrl
  it('should throw error for invalid rootUrl', () => {
    // expect: invalid rootUrl causes an error to be thrown
    expect(() => collectionPageSchema({ rootUrl: '', path: 'collections' })).toThrow();
  });

  // it: should include correct canonical URL
  it('should include correct canonical URL', () => {
    const result = collectionPageSchema({ rootUrl: 'https://example.com', path: 'collections' });
    // expect: url is set to canonical URL
    expect((result as unknown as Record<string, unknown>).url).toBe('https://example.com/collections');
  });

  // it: should include site references
  it('should include site references', () => {
    const result = collectionPageSchema({ rootUrl: 'https://example.com', path: 'collections' });
    // expect: includes isPartOf, publisher, and author references
    expect((result as unknown as Record<string, unknown>).isPartOf).toEqual({ '@id': 'https://example.com#website' });
    expect((result as unknown as Record<string, unknown>).publisher).toEqual({
      '@id': 'https://example.com#organization',
    });
    expect((result as unknown as Record<string, unknown>).author).toEqual({ '@id': 'https://example.com#person' });
  });

  // it: should handle overrides
  it('should handle valid overrides', () => {
    const result = collectionPageSchema(
      { rootUrl: 'https://example.com', path: 'collections' },
      { name: 'Custom Collection' }
    );
    // expect: override is applied
    expect((result as unknown as Record<string, unknown>).name).toBe('Custom Collection');
  });

  // it: should set correct language
  it('should set correct language', () => {
    const result = collectionPageSchema({ rootUrl: 'https://example.com', path: 'collections' });
    // expect: language is set to en
    expect((result as unknown as Record<string, unknown>).inLanguage).toBe('en');
  });
});

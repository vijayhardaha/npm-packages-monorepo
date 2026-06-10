import { describe, it, expect } from 'vitest';

import { breadcrumbSchema } from '../breadCrumb';

// describe: Tests for breadcrumbSchema
describe('breadcrumbSchema', () => {
  // it: should create a valid BreadcrumbList schema
  it('should create a valid BreadcrumbList schema', () => {
    const items = [
      { name: 'Home', path: '' },
      { name: 'About', path: 'about' },
    ];
    const result = breadcrumbSchema({ rootUrl: 'https://example.com', items });
    // expect: verifies @type is BreadcrumbList
    expect((result as unknown as Record<string, unknown>)['@type']).toBe('BreadcrumbList');
    // expect: itemListElement contains two entries
    expect((result as unknown as { itemListElement: unknown[] }).itemListElement).toHaveLength(2);
  });

  // it: should throw error for invalid rootUrl
  it('should throw error for invalid rootUrl', () => {
    // expect: invalid rootUrl causes error
    expect(() => breadcrumbSchema({ rootUrl: '', items: [{ name: 'Home', path: '' }] })).toThrow();
  });

  // it: should remove undefined fields from overrides
  it('should remove undefined fields from overrides', () => {
    const items = [{ name: 'Home', path: '' }];
    const result = breadcrumbSchema({ rootUrl: 'https://example.com', items }, { description: undefined });
    // expect: undefined fields are removed
    expect((result as unknown as Record<string, unknown>).description).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';

import { aboutPageSchema, contactPageSchema, webPageSchema } from '../webPage';

// describe: Tests for webPageSchema
describe('webPageSchema', () => {
  // it: should create a valid WebPage schema
  it('should create a valid WebPage schema', () => {
    const result = webPageSchema({ rootUrl: 'https://example.com', path: 'about' });
    // expect: returned schema has type WebPage
    expect(result['@type']).toBe('WebPage');
  });

  // it: should throw error for invalid rootUrl
  it('should throw error for invalid rootUrl', () => {
    // expect: invalid rootUrl triggers an error
    expect(() => webPageSchema({ rootUrl: '', path: 'test' })).toThrow();
  });

  // it: should include mainEntity when mainEntityId is provided
  it('should include mainEntity when mainEntityId is provided', () => {
    const result = webPageSchema({
      rootUrl: 'https://example.com',
      path: 'about',
      mainEntityId: 'https://example.com/person',
    });
    // expect: mainEntity is included in schema
    expect((result as unknown as Record<string, unknown>).mainEntity).toEqual({ '@id': 'https://example.com/person' });
  });

  // it: should include breadcrumb when breadcrumb option is true
  it('should include breadcrumb when breadcrumb option is true', () => {
    const result = webPageSchema({ rootUrl: 'https://example.com', path: 'about', breadcrumb: true });
    // expect: breadcrumb is included in schema
    expect((result as unknown as Record<string, unknown>).breadcrumb).toEqual({
      '@id': 'https://example.com/about#breadcrumb',
    });
  });

  // it: should handle overrides without triggering delete
  it('should handle valid overrides', () => {
    const result = webPageSchema({ rootUrl: 'https://example.com', path: 'about' }, { name: 'Custom Page' });
    // expect: override is applied
    expect((result as unknown as Record<string, unknown>).name).toBe('Custom Page');
  });
});

// describe: Tests for aboutPageSchema
describe('aboutPageSchema', () => {
  // it: should create a valid AboutPage schema
  it('should create a valid AboutPage schema', () => {
    const result = aboutPageSchema({ rootUrl: 'https://example.com', path: 'about' });
    // expect: returned schema has type AboutPage
    expect(result['@type']).toBe('AboutPage');
  });
});

// describe: Tests for contactPageSchema
describe('contactPageSchema', () => {
  // it: should create a valid ContactPage schema
  it('should create a valid ContactPage schema', () => {
    const result = contactPageSchema({ rootUrl: 'https://example.com', path: 'contact' });
    // expect: returned schema has type ContactPage
    expect(result['@type']).toBe('ContactPage');
  });
});

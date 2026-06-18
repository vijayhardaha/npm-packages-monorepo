import { describe, it, expect } from 'vitest';

import { blogPostingSchema } from '../blogPosting';

// describe: Tests for blogPostingSchema
describe('blogPostingSchema', () => {
  // it: should create a valid BlogPosting schema
  it('should create a valid BlogPosting schema', () => {
    const result = blogPostingSchema({ rootUrl: 'https://example.com', path: 'blog/my-post' });
    // expect: returned schema has type BlogPosting
    expect(result['@type']).toBe('BlogPosting');
  });

  // it: should throw error for invalid rootUrl
  it('should throw error for invalid rootUrl', () => {
    // expect: invalid rootUrl causes an error to be thrown
    expect(() => blogPostingSchema({ rootUrl: '', path: 'blog/my-post' })).toThrow();
  });

  // it: should include correct canonical URL
  it('should include correct canonical URL', () => {
    const result = blogPostingSchema({ rootUrl: 'https://example.com', path: 'blog/my-post' });
    // expect: url is set to canonical URL
    expect((result as unknown as Record<string, unknown>).url).toBe('https://example.com/blog/my-post');
  });

  // it: should include publisher reference
  it('should include publisher reference', () => {
    const result = blogPostingSchema({ rootUrl: 'https://example.com', path: 'blog/my-post' });
    // expect: publisher is set correctly
    expect((result as unknown as Record<string, unknown>).publisher).toEqual({
      '@id': 'https://example.com#organization',
    });
  });

  // it: should include mainEntityOfPage
  it('should include mainEntityOfPage', () => {
    const result = blogPostingSchema({ rootUrl: 'https://example.com', path: 'blog/my-post' });
    // expect: mainEntityOfPage is set correctly
    expect((result as unknown as Record<string, unknown>).mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://example.com/blog/my-post',
    });
  });

  // it: should handle overrides
  it('should handle valid overrides', () => {
    const result = blogPostingSchema(
      { rootUrl: 'https://example.com', path: 'blog/my-post' },
      { headline: 'Custom Headline' }
    );
    // expect: override is applied
    expect((result as unknown as Record<string, unknown>).headline).toBe('Custom Headline');
  });

  // it: should set correct language
  it('should set correct language', () => {
    const result = blogPostingSchema({ rootUrl: 'https://example.com', path: 'blog/my-post' });
    // expect: language is set to en
    expect((result as unknown as Record<string, unknown>).inLanguage).toBe('en');
  });
});

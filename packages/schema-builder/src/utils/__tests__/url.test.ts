import { describe, it, expect } from 'vitest';

import { resolveUrl, cleanUrl, validateUrl } from '../url';

// describe: Tests for resolveUrl
describe('resolveUrl', () => {
  // it: should build a canonical URL with path
  it('should build a canonical URL with path', () => {
    // expect: resolves path appended to base URL
    expect(resolveUrl('https://example.com', 'about')).toBe('https://example.com/about');
  });

  // it: should remove trailing slash when path is empty
  it('should remove trailing slash when path is empty', () => {
    // expect: trims trailing slash for empty path
    expect(resolveUrl('https://example.com/', '')).toBe('https://example.com');
    // expect: leaves URL unchanged when already clean
    expect(resolveUrl('https://example.com', '')).toBe('https://example.com');
  });

  // it: should remove trailing slash when path is /
  it('should remove trailing slash when path is /', () => {
    // expect: path '/' treated as empty
    expect(resolveUrl('https://example.com', '/')).toBe('https://example.com');
    // expect: handles base with trailing slash
    expect(resolveUrl('https://example.com/', '/')).toBe('https://example.com');
  });
});

// describe: Tests for cleanUrl
describe('cleanUrl', () => {
  // it: should remove trailing slash when true
  it('should remove trailing slash when true', () => {
    // expect: trailing slashes removed when flag true
    expect(cleanUrl('https://example.com/', true)).toBe('https://example.com');
    // expect: works for nested paths
    expect(cleanUrl('https://example.com/page/', true)).toBe('https://example.com/page');
  });

  // it: should add trailing slash when false
  it('should add trailing slash when false', () => {
    // expect: adds trailing slash when missing
    expect(cleanUrl('https://example.com', false)).toBe('https://example.com/');
    // expect: preserves existing trailing slash for pages
    expect(cleanUrl('https://example.com/page', false)).toBe('https://example.com/page/');
  });

  // it: should not modify URL already in correct state
  it('should not modify URL already in correct state', () => {
    // expect: no-op when already matches flags
    expect(cleanUrl('https://example.com', true)).toBe('https://example.com');
    // expect: no-op when already has trailing slash
    expect(cleanUrl('https://example.com/', false)).toBe('https://example.com/');
  });

  // it: should remove query string when true
  it('should remove query string when true', () => {
    // expect: query strings stripped when requested
    expect(cleanUrl('https://example.com/page?q=1', true, true)).toBe('https://example.com/page');
    expect(cleanUrl('https://example.com/page?q=1&sort=asc', true, true)).toBe('https://example.com/page');
  });

  // it: should preserve query string when false
  it('should preserve query string when false', () => {
    // expect: query strings preserved when not removed
    expect(cleanUrl('https://example.com/page?q=1', true, false)).toBe('https://example.com/page?q=1');
  });
});

// describe: Tests for validateUrl
describe('validateUrl', () => {
  // it: should throw error for invalid protocol
  it('should throw error for invalid protocol', () => {
    // expect: throws when URL uses invalid protocol
    expect(() => validateUrl('ftp://example.com')).toThrow('URL must be a valid HTTP/HTTPS URL');
  });
});

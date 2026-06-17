import { describe, it, expect } from 'vitest';

import { buildId, toGraph } from '../schema';

// describe: Tests for buildId
describe('buildId', () => {
  // it: should build a schema ID from URL and id
  it('should build a schema ID from URL and id', () => {
    // expect: buildId concatenates base URL and fragment id
    expect(buildId('https://example.com', 'person')).toBe('https://example.com#person');
    // expect: works for different ids
    expect(buildId('https://example.com', 'website')).toBe('https://example.com#website');
  });

  // it: should remove trailing slash from URL
  it('should remove trailing slash from URL', () => {
    // expect: trailing slash trimmed before adding fragment
    expect(buildId('https://example.com/', 'person')).toBe('https://example.com#person');
    expect(buildId('https://example.com/page/', 'app')).toBe('https://example.com/page#app');
  });
});

// describe: Tests for toGraph
describe('toGraph', () => {
  // it: should wrap a single entity in @graph
  it('should wrap a single entity in @graph', () => {
    const entity = { '@type': 'Person', name: 'John' };
    const result = toGraph(entity);
    // expect: result contains @context and @graph with the entity
    expect(result).toEqual({ '@context': 'https://schema.org', '@graph': [entity] });
  });

  // it: should wrap multiple entities in @graph
  it('should wrap multiple entities in @graph', () => {
    const person = { '@type': 'Person', name: 'John' };
    const website = { '@type': 'WebSite', name: 'Example' };
    const result = toGraph(person, website);
    // expect: multiple entities preserved in @graph order
    expect(result).toEqual({ '@context': 'https://schema.org', '@graph': [person, website] });
  });

  // it: should throw for empty entities
  it('should throw for empty entities', () => {
    // expect: throws when no entities provided
    expect(() => toGraph()).toThrow('At least one schema entity is required');
  });
});

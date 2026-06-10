import { describe, it, expect } from 'vitest';

import { personSchema } from '../person';

// describe: Tests for personSchema
describe('personSchema', () => {
  // it: should create a valid Person schema
  it('should create a valid Person schema', () => {
    const result = personSchema({ rootUrl: 'https://example.com' });
    // expect: asserts that @type is Person
    expect((result as unknown as Record<string, unknown>)['@type']).toBe('Person');
  });

  // it: should throw error for invalid rootUrl
  it('should throw error for invalid rootUrl', () => {
    // expect: throws when rootUrl is invalid
    expect(() => personSchema({ rootUrl: '' })).toThrow();
  });
});

import { describe, it, expect } from 'vitest';

import { organizationSchema } from '../organization';

// describe: Tests for organizationSchema
describe('organizationSchema', () => {
  // it: should create a valid Organization schema
  it('should create a valid Organization schema', () => {
    const result = organizationSchema({ rootUrl: 'https://example.com' });
    // expect: confirms schema type is Organization
    expect((result as unknown as Record<string, unknown>)['@type']).toBe('Organization');
  });

  // it: should throw error for invalid rootUrl
  it('should throw error for invalid rootUrl', () => {
    // expect: invalid rootUrl triggers error
    expect(() => organizationSchema({ rootUrl: '' })).toThrow();
  });
});

/**
 * Represents a generic JSON-LD schema entity with string keys and unknown values.
 */
export type SchemaEntity = Record<string, unknown>;

/**
 * Checks whether a value is a plain object (not null, not an array).
 *
 * @param {unknown} value - The value to check.
 *
 * @returns {boolean} True if the value is a non-null, non-array object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively merges override properties into a base schema entity.
 *
 * @param {SchemaEntity} base - The base schema entity to merge into.
 * @param {SchemaEntity | undefined} overrides - The override properties to apply.
 *
 * @returns {SchemaEntity} A new schema entity with deeply merged properties.
 *
 * @example
 * deepMerge({ name: 'Test' }, { url: 'https://example.com' });
 * // { name: 'Test', url: 'https://example.com' }
 */
export function deepMerge(base: SchemaEntity, overrides: SchemaEntity | undefined): SchemaEntity {
  if (!overrides) return base;

  const result: SchemaEntity = { ...base };

  for (const key in overrides) {
    const overrideValue = overrides[key];

    if (overrideValue === undefined) continue;

    const baseValue = base[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }

  return result;
}

/**
 * Merges overrides into a schema while preserving the original `@type` value.
 *
 * @param {SchemaEntity} schema - The base schema entity containing the `@type` to preserve.
 * @param {SchemaEntity} [overrides] - Optional override properties to merge.
 *
 * @returns {SchemaEntity} A merged schema entity with the original `@type` intact.
 */
export function mergeWithType(schema: SchemaEntity, overrides?: SchemaEntity): SchemaEntity {
  const merged = deepMerge(schema, overrides);

  // Restore the original @type to prevent overrides from changing the schema type.
  const typeValue = schema['@type'];

  if (typeValue !== undefined) {
    merged['@type'] = typeValue;
  }

  return merged;
}

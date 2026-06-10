import { type JSX } from 'react';

import type { SchemaEntity } from '@/utils/merge';
import { toGraph } from '@/utils/schema';

/**
 * Serializes data to JSON and escapes HTML script-closing tags to prevent XSS injection.
 *
 * @param {unknown} data - The data object to serialize as a safe JSON string.
 *
 * @returns {string} An escaped JSON string safe for embedding inside a script tag.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Renders a Schema.org JSON-LD script tag with a graph of structured data entities.
 *
 * @param {{ data: SchemaEntity[] }} props - An array of Schema.org entity objects to embed.
 *
 * @returns {JSX.Element} A script element containing the serialized JSON-LD graph.
 */
export default function JsonLd({ data }: { data: SchemaEntity[] }): JSX.Element {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(toGraph(...data)) }} />;
}

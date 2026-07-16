import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImage } from './types';

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  useCdn: true,
});

export const sanityWriteClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  useCdn: false,
  token: import.meta.env.SANITY_WRITE_TOKEN,
});

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImage) {
  return builder.image(source);
}

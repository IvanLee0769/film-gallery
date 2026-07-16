import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity';

export default defineConfig({
  name: 'film-gallery',
  title: 'FilmGallery',
  projectId: 'y3tgh75k',
  dataset: 'production',
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});

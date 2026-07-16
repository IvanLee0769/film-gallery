import { defineType, defineField } from 'sanity';

export const roll = defineType({
  name: 'roll',
  title: 'Roll',
  type: 'document',
  fields: [
    defineField({
      name: 'rollNumber',
      title: 'Roll Number',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'filmType', title: 'Film Type', type: 'string' }),
    defineField({ name: 'camera', title: 'Camera', type: 'string' }),
    defineField({ name: 'lens', title: 'Lens', type: 'string' }),
    defineField({ name: 'iso', title: 'ISO', type: 'string' }),
    defineField({ name: 'shotDate', title: 'Shot Date', type: 'date' }),
    defineField({ name: 'endDate', title: 'End Date', type: 'date' }),
    defineField({ name: 'developer', title: 'Developer', type: 'string' }),
    defineField({ name: 'scanner', title: 'Scanner', type: 'string' }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (rule) => rule.min(0).max(5),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [{ type: 'photo' }],
      options: { layout: 'grid' },
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'enableComments',
      title: 'Enable Comments',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    { title: 'Shot Date (newest)', name: 'shotDateDesc', by: [{ field: 'shotDate', direction: 'desc' }] },
    { title: 'Roll Number', name: 'rollNumberAsc', by: [{ field: 'rollNumber', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'rollNumber', media: 'coverImage' },
  },
});

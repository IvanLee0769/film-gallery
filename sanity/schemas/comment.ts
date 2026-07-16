import { defineType, defineField } from 'sanity';

export const comment = defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    defineField({
      name: 'roll',
      title: 'Roll',
      type: 'reference',
      to: [{ type: 'roll' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'nickname',
      title: 'Nickname',
      type: 'string',
      validation: (rule) => rule.required().max(50),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'text',
      validation: (rule) => rule.required().max(1000),
    }),
    defineField({
      name: 'isApproved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: 'nickname', subtitle: 'content' },
  },
});

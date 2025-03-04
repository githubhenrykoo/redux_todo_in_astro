import { defineCollection } from 'astro:content';

const modelCollection = defineCollection({
  type: 'content',
});

export const collections = {
  'model': modelCollection,
};
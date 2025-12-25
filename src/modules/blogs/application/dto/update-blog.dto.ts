import { z } from 'zod';

export const UpdateBlogSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(1, 'Content is required'),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(200, 'Slug must be less than 200 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')
    .optional(), // Make it optional if you want to auto-generate from title
  tags: z.array(z.string().trim().min(1)).default([]),
  category: z.string()
    .min(1, 'Category is required')
    .trim(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
});

export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;
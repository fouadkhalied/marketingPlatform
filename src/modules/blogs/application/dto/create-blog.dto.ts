import { z } from 'zod';

export const CreateBlogSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(1, 'Content is required'),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  category: z.string()
    .min(1, 'Category is required')
    .trim(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
});

export type CreateBlogDto = z.infer<typeof CreateBlogSchema>;

import { z } from 'zod';

export const UpdateBlogSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  content: z.string()
    .min(1, 'Content is required')
    .optional(),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  category: z.string()
    .min(1, 'Category is required')
    .trim()
    .optional(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional()
});

export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;

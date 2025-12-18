import { z } from 'zod';

export const BlogPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'views', 'likes', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type BlogPaginationDto = z.infer<typeof BlogPaginationSchema>;

export interface PaginatedBlogResponse {
  blogs: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

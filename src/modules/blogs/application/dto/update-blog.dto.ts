import { z } from 'zod';
import { LocalizedContentSchema, OptionalLocalizedContentSchema, SlugSchema, TagsSchema } from "./locallizedSchema.dto";

export const UpdateBlogSchema = z.object({
  title: LocalizedContentSchema.optional(),
  content: LocalizedContentSchema.optional(),
  excerpt: OptionalLocalizedContentSchema,
  slug: SlugSchema,
  tags: TagsSchema.optional(),
  category: LocalizedContentSchema.optional(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional()
});

export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;
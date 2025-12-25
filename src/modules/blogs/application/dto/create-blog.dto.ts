import {z} from 'zod';
import { LocalizedContentSchema, OptionalLocalizedContentSchema, SlugSchema, TagsSchema } from "./locallizedSchema.dto";

export const CreateBlogSchema = z.object({
  title: LocalizedContentSchema,
  content: LocalizedContentSchema,
  excerpt: OptionalLocalizedContentSchema,
  slug: SlugSchema,
  tags: TagsSchema.default({ en: [], ar: [] }),
  category: LocalizedContentSchema,
  featuredImage: z.string().url().optional(),
});

export type CreateBlogDto = z.infer<typeof CreateBlogSchema>;
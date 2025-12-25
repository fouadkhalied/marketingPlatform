import { z } from 'zod';

// Localized content schema for bilingual fields
export const LocalizedContentSchema = z.object({
    en: z.string().optional(),
    ar: z.string().optional()
  }).refine(
    (data) => data.en || data.ar,
    { message: 'At least one language (English or Arabic) is required' }
  );
  
  // Optional localized content (for excerpt)
  export const OptionalLocalizedContentSchema = z.object({
    en: z.string().max(500, 'English excerpt must be less than 500 characters').optional(),
    ar: z.string().max(500, 'Arabic excerpt must be less than 500 characters').optional()
  }).optional();
  
  // Slug schema with language-specific validation
  export const SlugSchema = z.object({
    en: z.string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'English slug must be lowercase with hyphens only')
      .optional(),
    ar: z.string().optional()
  }).refine(
    (data) => data.en || data.ar,
    { message: 'At least one language slug is required' }
  ).optional(); // Optional because it can be auto-generated
  
  // Tags schema for bilingual tags
  export const TagsSchema = z.object({
    en: z.array(z.string().trim().min(1)).default([]),
    ar: z.array(z.string().trim().min(1)).default([])
  });
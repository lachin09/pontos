import { z } from "zod";

const categoryText = z
  .object({
    name: z.string().trim().max(120),
    description: z.string().trim().max(2000),
  })
  .partial();

export const adminCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).default(""),
  sort_order: z.number().int().min(0).max(100000),
  is_active: z.boolean(),
  /** Russian / English name and description; empty falls back to Ukrainian. */
  translations: z
    .object({
      ru: categoryText.optional(),
      en: categoryText.optional(),
    })
    .default({}),
});

export const adminCategoryReorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

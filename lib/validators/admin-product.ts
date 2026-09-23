import { z } from "zod";

const money = z.number().finite().min(0).max(99999999.99);

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(1).max(80),
  size: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(80),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  price: money,
  stock: z.number().int().min(0).max(100000),
  is_available: z.boolean(),
});

export const adminProductSchema = z
  .object({
    category_id: z.string().uuid(),
    name: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().max(10000),
    composition: z.string().max(2000),
    care_instructions: z.string().max(2000),
    price: money,
    old_price: money.nullable(),
    is_published: z.boolean(),
    is_available: z.boolean(),
    is_featured: z.boolean(),
    is_new: z.boolean(),
    is_sale: z.boolean(),
    variants: z.array(variantSchema).min(1).max(100),
  })
  .superRefine((product, ctx) => {
    const skus = product.variants.map((variant) => variant.sku.toLowerCase());
    if (new Set(skus).size !== skus.length) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Артикул має бути унікальним.",
      });
    }
    const combinations = product.variants.map(
      (variant) =>
        `${variant.size.toLowerCase()}|${variant.color.toLowerCase()}`,
    );
    if (new Set(combinations).size !== combinations.length) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Розмір і колір варіанта мають бути унікальними.",
      });
    }
    product.variants.forEach((variant, index) => {
      if (
        variant.id &&
        product.variants.some(
          (other, otherIndex) =>
            otherIndex !== index && other.id === variant.id,
        )
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "id"],
          message: "Варіант повторюється.",
        });
      }
    });
  });

export const adminProductImageSchema = z.object({
  alt: z.string().trim().max(200).optional().default(""),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;
export type AdminProductVariantInput = z.infer<typeof variantSchema>;

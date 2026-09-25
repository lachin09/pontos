import type { z } from "zod";

/**
 * Key/value store settings. New settings need no new methods: each caller
 * brings its key, a schema and a default.
 */
export interface SettingsRepository {
  /** Stored value if it passes the schema, otherwise `fallback`. Throws if the read fails. */
  get<Schema extends z.ZodType>(
    key: string,
    schema: Schema,
    fallback: z.infer<Schema>,
  ): Promise<z.infer<Schema>>;
  save(key: string, value: unknown): Promise<void>;
}

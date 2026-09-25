import type { PostgrestError } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";

/** Postgres error codes the app reacts to. */
export const PG = {
  uniqueViolation: "23505",
  foreignKeyViolation: "23503",
  raiseException: "P0001",
  noDataFound: "P0002",
} as const;

/**
 * Translates a database error into a user-facing AppError. Known codes map
 * to specific errors; anything else becomes `fallback`. Keeps Postgres codes
 * inside the repository layer.
 */
export function translateDbError(
  error: PostgrestError,
  known: Partial<Record<string, AppError>>,
  fallback: AppError,
  logLabel?: string,
): AppError {
  const mapped = known[error.code];
  if (mapped) return mapped;
  if (logLabel) console.error(logLabel, error.code);
  return fallback;
}

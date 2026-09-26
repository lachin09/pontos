import type { PostgrestError } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { badRequest, conflict } from "@/lib/errors";
import { PG, translateDbError } from "@/lib/supabase/db-error";

const dbError = (code: string) =>
  ({
    code,
    message: "db",
    details: "",
    hint: "",
    name: "PostgrestError",
  }) as PostgrestError;

describe("translateDbError", () => {
  const duplicate = conflict("Вже існує");
  const fallback = badRequest("Не вдалося");

  it("maps known Postgres codes to their errors", () => {
    expect(
      translateDbError(
        dbError(PG.uniqueViolation),
        { [PG.uniqueViolation]: duplicate },
        fallback,
      ),
    ).toBe(duplicate);
  });

  it("uses the fallback and logs unknown codes", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      translateDbError(dbError("XX000"), {}, fallback, "Save failed"),
    ).toBe(fallback);
    expect(log).toHaveBeenCalledWith("Save failed", "XX000");
  });

  it("stays quiet without a log label", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    translateDbError(dbError("XX000"), {}, fallback);
    expect(log).not.toHaveBeenCalled();
  });
});

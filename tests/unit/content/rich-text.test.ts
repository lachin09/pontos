import { describe, expect, it } from "vitest";
import { parseRichText } from "@/components/content/rich-text";

describe("parseRichText", () => {
  it("splits paragraphs on blank lines and keeps line breaks inside them", () => {
    expect(parseRichText("Рядок 1\nРядок 2\n\nДругий абзац")).toEqual([
      { kind: "paragraph", lines: ["Рядок 1", "Рядок 2"] },
      { kind: "paragraph", lines: ["Другий абзац"] },
    ]);
  });

  it("turns '## ' lines into headings", () => {
    expect(parseRichText("## Оплата\nПереказ або готівка")).toEqual([
      { kind: "heading", text: "Оплата" },
      { kind: "paragraph", lines: ["Переказ або готівка"] },
    ]);
  });

  it("groups '- ' and '• ' lines into one list", () => {
    expect(parseRichText("Способи:\n- Нова пошта\n• Укрпошта")).toEqual([
      { kind: "paragraph", lines: ["Способи:"] },
      { kind: "list", items: ["Нова пошта", "Укрпошта"] },
    ]);
  });

  it("ends a list when normal text follows", () => {
    expect(parseRichText("- один\nтекст")).toEqual([
      { kind: "list", items: ["один"] },
      { kind: "paragraph", lines: ["текст"] },
    ]);
  });

  it("handles Windows line endings and stray whitespace", () => {
    expect(parseRichText("  ## Заголовок  \r\n\r\n   \r\nТекст ")).toEqual([
      { kind: "heading", text: "Заголовок" },
      { kind: "paragraph", lines: ["Текст"] },
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(parseRichText("   \n\n ")).toEqual([]);
  });

  it("keeps markup-like text as plain text", () => {
    expect(parseRichText("<script>alert(1)</script>")).toEqual([
      { kind: "paragraph", lines: ["<script>alert(1)</script>"] },
    ]);
  });
});

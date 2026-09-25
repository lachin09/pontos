import type { ReactNode } from "react";

type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; lines: string[] };

/**
 * Parses the admin's plain-text format: blank line = new block, "## " =
 * heading, "- " = list item. Rendered as React text, so no HTML from the
 * admin ever reaches the page.
 */
export function parseRichText(source: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of source.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    let paragraph: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (paragraph.length)
        blocks.push({ kind: "paragraph", lines: paragraph });
      if (list.length) blocks.push({ kind: "list", items: list });
      paragraph = [];
      list = [];
    };
    for (const line of lines) {
      if (line.startsWith("## ")) {
        flush();
        blocks.push({ kind: "heading", text: line.slice(3).trim() });
      } else if (/^[-•]\s+/.test(line)) {
        if (paragraph.length) flush();
        list.push(line.replace(/^[-•]\s+/, ""));
      } else {
        if (list.length) flush();
        paragraph.push(line);
      }
    }
    flush();
  }
  return blocks;
}

export function RichText({ source }: { source: string }) {
  return (
    <div className="grid gap-4 text-[0.95rem] leading-7 text-foreground/85">
      {parseRichText(source).map((block, index): ReactNode => {
        if (block.kind === "heading") {
          return (
            <h2
              key={index}
              className="mt-6 text-2xl leading-tight text-foreground first:mt-0"
            >
              {block.text}
            </h2>
          );
        }
        if (block.kind === "list") {
          return (
            <ul
              key={index}
              className="grid list-disc gap-1.5 pl-5 marker:text-accent"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {block.lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

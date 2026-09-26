import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RichText } from "@/components/content/rich-text";

describe("RichText", () => {
  it("renders headings, lists and paragraphs", () => {
    render(<RichText source={"## Оплата\n- Переказ\n- Готівка\n\nДякуємо"} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Оплата" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ["Переказ", "Готівка"],
    );
    expect(screen.getByText("Дякуємо").closest("p")).not.toBeNull();
  });

  it("shows HTML typed by the admin as text instead of running it", () => {
    const { container } = render(
      <RichText source={'<img src=x onerror="alert(1)">'} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(
      screen.getByText('<img src=x onerror="alert(1)">'),
    ).toBeInTheDocument();
  });
});

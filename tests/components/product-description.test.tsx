import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductDescription } from "@/components/product/product-description";

const source = [
  "Косуха глибокого бордового кольору.",
  "",
  "- Асиметрична блискавка",
  "- Пояс із пряжкою",
  "",
  "Сезон: демісезон",
  "Виробництво: Туреччина",
].join("\n");

describe("ProductDescription", () => {
  it("shows the lead, the details list and the specifications", () => {
    render(
      <ProductDescription
        source={source}
        extraSpecs={[{ label: "Колір", value: "Бордовий" }]}
      />,
    );

    expect(
      screen.getByText("Косуха глибокого бордового кольору."),
    ).toBeInTheDocument();
    const details = screen.getByRole("list");
    expect(within(details).getAllByRole("listitem")).toHaveLength(2);

    const specs = screen.getAllByRole("definition").map((dd) => dd.textContent);
    expect(specs).toEqual(["Бордовий", "демісезон", "Туреччина"]);
  });

  it("renders an old single-paragraph description as the lead", () => {
    render(<ProductDescription source="Просто опис товару." />);
    expect(screen.getByText("Просто опис товару.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

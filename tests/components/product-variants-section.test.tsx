import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProductVariantsSection } from "@/components/admin/product-form/product-variants-section";
import { newColor } from "@/components/admin/product-form/product-draft";
import type { ProductColorDraft } from "@/components/admin/product-form/types";

function Harness() {
  const [colors, setColors] = useState<ProductColorDraft[]>([newColor()]);
  return (
    <ProductVariantsSection
      colors={colors}
      price="9500"
      onAdd={() => setColors((current) => [...current, newColor()])}
      onChange={(index, patch) =>
        setColors((current) =>
          current.map((color, row) =>
            row === index ? { ...color, ...patch } : color,
          ),
        )
      }
      onRemove={(index) =>
        setColors((current) => current.filter((_, row) => row !== index))
      }
    />
  );
}

const sizeLabels = () =>
  screen
    .getAllByLabelText("Розмір")
    .map((input) => (input as HTMLInputElement).value);

describe("ProductVariantsSection", () => {
  it("adds and removes sizes of a colour by ticking them", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "L" }));
    await userEvent.click(screen.getByRole("button", { name: "48" }));
    await userEvent.click(screen.getByRole("button", { name: "M" }));

    expect(sizeLabels()).toEqual(["M", "L", "48"]);
    expect(screen.getByRole("button", { name: "48" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByLabelText("Ціна, ₴")[0]).toHaveValue(9500);

    await userEvent.click(screen.getByRole("button", { name: "L" }));
    expect(sizeLabels()).toEqual(["M", "48"]);
  });

  it("adds typed sizes on Enter and shows them as chips", async () => {
    render(<Harness />);

    await userEvent.type(
      screen.getByLabelText("Інший розмір"),
      "6xl, Один розмір{Enter}",
    );

    expect(sizeLabels()).toEqual(["6XL", "Один розмір"]);
    expect(screen.getByLabelText("Інший розмір")).toHaveValue("");
    await userEvent.click(screen.getByRole("button", { name: "Один розмір" }));
    expect(sizeLabels()).toEqual(["6XL"]);
  });

  it("keeps the sizes of each colour separate", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "Додати колір" }));
    const [first, second] = screen
      .getAllByLabelText("Колір")
      .map((input) => input.closest("div.rounded-md") as HTMLElement);
    await userEvent.click(within(second).getByRole("button", { name: "XL" }));

    expect(within(first).queryByLabelText("Розмір")).toBeNull();
    expect(within(second).getByLabelText("Розмір")).toHaveValue("XL");
  });
});

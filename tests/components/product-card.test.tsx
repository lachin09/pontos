import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "@/components/product/product-card";
import { makeImage, makeProduct, makeVariant } from "../support/factories";

const plain = (text: string | null) => (text ?? "").replace(/\s/g, " ");

describe("ProductCard", () => {
  it("is a single link to the product page", () => {
    const product = makeProduct({
      name: "Пальто SANSAR",
      slug: "palto-sansar",
    });
    render(<ProductCard product={product} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/product/palto-sansar");
    expect(links[0]).toHaveAccessibleName("Пальто SANSAR");
  });

  it("shows the discount, sale price and old price when reduced", () => {
    render(
      <ProductCard product={makeProduct({ price: 750, oldPrice: 1000 })} />,
    );
    expect(screen.getByText("−25%")).toBeInTheDocument();
    expect(plain(screen.getByText(/750/).textContent)).toBe("750 ₴");
    expect(
      screen.getByText("Стара ціна:", { exact: false }),
    ).toBeInTheDocument();
  });

  it("shows no discount badge when there is no real saving", () => {
    render(
      <ProductCard product={makeProduct({ isSale: true, oldPrice: null })} />,
    );
    expect(screen.queryByText(/−\d+%/)).not.toBeInTheDocument();
  });

  it("marks sold-out products instead of new ones", () => {
    render(
      <ProductCard
        product={makeProduct({ isNew: true, isAvailable: false })}
      />,
    );
    expect(screen.getByText("Немає в наявності")).toBeInTheDocument();
    expect(screen.queryByText("Новинка")).not.toBeInTheDocument();
  });

  it("describes colours with correct Ukrainian plurals and caps the swatches", () => {
    const colors = ["Чорний", "Бежевий", "Сірий", "Зелений", "Синій", "Білий"];
    render(
      <ProductCard
        product={makeProduct({
          variants: colors.map((color) => makeVariant({ color })),
        })}
      />,
    );
    const swatches = screen.getByRole("img", { name: /кольорів/ });
    expect(swatches).toHaveAccessibleName(`6 кольорів: ${colors.join(", ")}`);
    expect(within(swatches).getByText("+1")).toBeInTheDocument();
  });

  it("uses the first photo's alt text", () => {
    const product = makeProduct({
      images: [makeImage({ alt: "Пальто спереду" }), makeImage()],
    });
    render(<ProductCard product={product} />);
    expect(screen.getByAltText("Пальто спереду")).toBeInTheDocument();
  });
});

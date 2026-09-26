import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ProductColorProvider } from "@/components/product/product-color-context";
import { ProductPurchase } from "@/components/product/product-purchase";
import { useCartStore } from "@/stores/cart.store";
import type { Product } from "@/types/product";
import { makeImage, makeProduct, makeVariant } from "../support/factories";

const blackPhoto = makeImage({ color: "Чорний" });
const beigePhoto = makeImage({ color: "Бежевий" });

const product = makeProduct({
  name: "Пальто",
  price: 3000,
  images: [beigePhoto, blackPhoto],
  variants: [
    makeVariant({ id: "black-s", color: "Чорний", size: "S", stock: 2 }),
    makeVariant({ id: "black-m", color: "Чорний", size: "M", stock: 20 }),
    makeVariant({ id: "beige-s", color: "Бежевий", size: "S", stock: 0 }),
    makeVariant({ id: "beige-m", color: "Бежевий", size: "M", stock: 7 }),
  ],
});

function renderPurchase(item: Product = product) {
  const user = userEvent.setup();
  render(
    <ProductColorProvider product={item}>
      <ProductPurchase product={item} />
    </ProductColorProvider>,
  );
  return user;
}

const mainAddButton = () =>
  screen.getByRole("button", { name: /Додати в кошик|Немає в наявності/ });

beforeEach(() => useCartStore.setState({ items: [] }));

describe("ProductPurchase", () => {
  it("starts on the first available colour and size", () => {
    renderPurchase();
    expect(screen.getByRole("button", { name: "Чорний" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "S" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("warns when stock is low and reassures when it is not", async () => {
    const user = renderPurchase();
    expect(screen.getByText("Залишилось лише 2 шт.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "M" }));
    expect(
      screen.getByText("В наявності, готово до відправки"),
    ).toBeInTheDocument();
  });

  it("marks sizes that are sold out in the chosen colour", async () => {
    const user = renderPurchase();
    await user.click(screen.getByRole("button", { name: "Бежевий" }));
    expect(
      screen.getByRole("button", { name: "S, немає в наявності" }),
    ).toBeInTheDocument();
  });

  it("switching colour moves off a size that is sold out in it", async () => {
    const user = renderPurchase();
    await user.click(screen.getByRole("button", { name: "Бежевий" }));
    expect(screen.getByRole("button", { name: "M" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("stops the quantity at the stock level", async () => {
    const user = renderPurchase();
    const increase = screen.getAllByRole("button", {
      name: "Збільшити кількість",
    })[0];
    await user.click(increase);
    expect(increase).toBeDisabled();
    expect(screen.getAllByLabelText("Кількість")[0]).toHaveTextContent("2");
  });

  it("adds the chosen variant with its colour photo and confirms", async () => {
    const user = renderPurchase();
    await user.click(screen.getByRole("button", { name: "M" }));
    await user.click(mainAddButton());

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        variantId: "black-m",
        color: "Чорний",
        size: "M",
        quantity: 1,
        maxQuantity: 20,
        productImage: blackPhoto.url,
      }),
    ]);
    const toast = screen.getByRole("status", { name: "" });
    expect(within(toast).getByText("Додано до кошика")).toBeInTheDocument();
    expect(
      within(toast).getByRole("link", { name: /Перейти до кошика/ }),
    ).toHaveAttribute("href", "/cart");
  });

  it("disables buying when the chosen variant is sold out", async () => {
    const soldOut = makeProduct({
      variants: [makeVariant({ size: "M", stock: 0, isAvailable: false })],
    });
    renderPurchase(soldOut);
    expect(mainAddButton()).toBeDisabled();
    expect(mainAddButton()).toHaveAccessibleName("Немає в наявності");
  });

  it("shows the sale price, old price and saving", () => {
    renderPurchase(
      makeProduct({
        price: 750,
        oldPrice: 1000,
        isSale: true,
        variants: [makeVariant({ price: 750 })],
      }),
    );
    expect(screen.getByText("Знижка −25%")).toBeInTheDocument();
    expect(screen.getByText(/Економія/).textContent?.replace(/\s/g, " ")).toBe(
      "Економія 250 ₴",
    );
  });
});

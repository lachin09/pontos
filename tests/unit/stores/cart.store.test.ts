// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore, type CartItem } from "@/stores/cart.store";

type NewItem = Omit<CartItem, "maxQuantity">;

const item = (overrides: Partial<NewItem> = {}): NewItem => ({
  productId: "p1",
  productSlug: "palto",
  variantId: "v1",
  productName: "Пальто",
  productImage: null,
  size: "M",
  color: "Чорний",
  price: 1000,
  quantity: 1,
  ...overrides,
});

const cart = () => useCartStore.getState();

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
});

describe("cart store", () => {
  it("adds a new line limited to the available stock", () => {
    cart().addItem(item({ quantity: 5 }), 3);
    expect(cart().items).toEqual([{ ...item(), quantity: 3, maxQuantity: 3 }]);
  });

  it("ignores items that are out of stock", () => {
    cart().addItem(item(), 0);
    expect(cart().items).toEqual([]);
  });

  it("merges the same variant and refreshes its details", () => {
    cart().addItem(item({ quantity: 2 }), 5);
    cart().addItem(
      item({ quantity: 2, price: 900, productName: "Пальто нове" }),
      5,
    );
    expect(cart().items).toHaveLength(1);
    expect(cart().items[0]).toMatchObject({
      quantity: 4,
      price: 900,
      productName: "Пальто нове",
    });
  });

  it("never merges past the latest stock level", () => {
    cart().addItem(item({ quantity: 3 }), 5);
    cart().addItem(item({ quantity: 3 }), 4);
    expect(cart().items[0]).toMatchObject({ quantity: 4, maxQuantity: 4 });
  });

  it("keeps quantities between 1 and the maximum", () => {
    cart().addItem(item(), 2);
    cart().increaseQuantity("v1");
    cart().increaseQuantity("v1");
    expect(cart().items[0].quantity).toBe(2);
    cart().decreaseQuantity("v1");
    cart().decreaseQuantity("v1");
    expect(cart().items[0].quantity).toBe(1);
    cart().setQuantity("v1", 99);
    expect(cart().items[0].quantity).toBe(2);
  });

  it("totals quantity and subtotal across lines", () => {
    cart().addItem(item({ quantity: 2 }), 10);
    cart().addItem(item({ variantId: "v2", price: 450, quantity: 3 }), 10);
    expect(cart().getTotalQuantity()).toBe(5);
    expect(cart().getSubtotal()).toBe(2 * 1000 + 3 * 450);
  });

  it("removes one line or clears everything", () => {
    cart().addItem(item(), 5);
    cart().addItem(item({ variantId: "v2" }), 5);
    cart().removeItem("v1");
    expect(cart().items.map((line) => line.variantId)).toEqual(["v2"]);
    cart().clearCart();
    expect(cart().items).toEqual([]);
  });

  it("persists only the items to localStorage", () => {
    cart().addItem(item(), 5);
    const saved = JSON.parse(localStorage.getItem("pontos-cart") ?? "{}");
    expect(saved.state).toEqual({ items: cart().items });
  });

  it("restores a saved cart on rehydration and marks itself hydrated", async () => {
    // Reset first: setState writes to storage and would overwrite the saved cart.
    useCartStore.setState({ items: [], hasHydrated: false });
    localStorage.setItem(
      "pontos-cart",
      JSON.stringify({
        state: { items: [{ ...item(), maxQuantity: 5 }] },
        version: 0,
      }),
    );
    await useCartStore.persist.rehydrate();
    expect(cart().items).toHaveLength(1);
    expect(cart().hasHydrated).toBe(true);
  });
});

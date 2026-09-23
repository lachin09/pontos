import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  productSlug: string;
  variantId: string;
  productName: string;
  productImage: string | null;
  size: string;
  color: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

interface CartStore {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (
    item: Omit<CartItem, "maxQuantity">,
    availableStock: number,
  ) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  increaseQuantity: (variantId: string) => void;
  decreaseQuantity: (variantId: string) => void;
  clearCart: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  getTotalQuantity: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      addItem: (item, availableStock) =>
        set((state) => {
          if (availableStock < 1) return state;
          const existingItem = state.items.find(
            (cartItem) => cartItem.variantId === item.variantId,
          );

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.variantId === item.variantId
                  ? {
                      ...cartItem,
                      productName: item.productName,
                      productImage: item.productImage,
                      price: item.price,
                      maxQuantity: availableStock,
                      quantity: Math.min(
                        cartItem.quantity + item.quantity,
                        availableStock,
                      ),
                    }
                  : cartItem,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: Math.max(1, Math.min(item.quantity, availableStock)),
                maxQuantity: availableStock,
              },
            ],
          };
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: Math.max(1, Math.min(quantity, item.maxQuantity)),
                }
              : item,
          ),
        })),
      increaseQuantity: (variantId) => {
        const item = get().items.find(
          (cartItem) => cartItem.variantId === variantId,
        );
        if (item) get().setQuantity(variantId, item.quantity + 1);
      },
      decreaseQuantity: (variantId) => {
        const item = get().items.find(
          (cartItem) => cartItem.variantId === variantId,
        );
        if (item) get().setQuantity(variantId, item.quantity - 1);
      },
      clearCart: () => set({ items: [] }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      getTotalQuantity: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
      getSubtotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),
    }),
    {
      name: "pontos-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: (state) => (rehydratedState) => {
        (rehydratedState ?? state).setHasHydrated(true);
      },
    },
  ),
);

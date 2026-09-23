import { create } from "zustand";
import type { CheckoutData } from "@/lib/validators/checkout";

interface CheckoutStore {
  data: CheckoutData | null;
  setData: (data: CheckoutData) => void;
  clear: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  clear: () => set({ data: null }),
}));

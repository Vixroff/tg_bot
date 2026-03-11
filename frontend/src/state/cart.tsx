import React from "react";

import type { Product } from "../types";

export type CartLine = {
  product: Product;
  quantity: number;
};

type CartState = {
  lines: Record<number, CartLine>;
};

type CartContextValue = {
  state: CartState;
  add: (product: Product, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  total: number;
  totalItems: number;
};

const CartContext = React.createContext<CartContextValue | null>(null);

const LS_KEY = "cart:v1";

function load(): CartState {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return { lines: {} };
  try {
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || typeof parsed !== "object") return { lines: {} };
    return parsed;
  } catch {
    return { lines: {} };
  }
}

function persist(state: CartState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CartState>(() => load());

  React.useEffect(() => {
    persist(state);
  }, [state]);

  const add = React.useCallback((product: Product, qty = 1) => {
    setState((prev) => {
      const existing = prev.lines[product.id];
      const nextQty = (existing?.quantity ?? 0) + qty;
      return {
        lines: {
          ...prev.lines,
          [product.id]: { product, quantity: clampQty(nextQty) }
        }
      };
    });
  }, []);

  const setQty = React.useCallback((productId: number, qty: number) => {
    setState((prev) => {
      const existing = prev.lines[productId];
      if (!existing) return prev;
      const q = clampQty(qty);
      if (q <= 0) {
        const { [productId]: _, ...rest } = prev.lines;
        return { lines: rest };
      }
      return { lines: { ...prev.lines, [productId]: { ...existing, quantity: q } } };
    });
  }, []);

  const remove = React.useCallback((productId: number) => {
    setState((prev) => {
      const { [productId]: _, ...rest } = prev.lines;
      return { lines: rest };
    });
  }, []);

  const clear = React.useCallback(() => setState({ lines: {} }), []);

  const linesArr = Object.values(state.lines);
  const total = linesArr.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const totalItems = linesArr.reduce((sum, l) => sum + l.quantity, 0);

  const value = React.useMemo<CartContextValue>(
    () => ({ state, add, setQty, remove, clear, total, totalItems }),
    [state, add, setQty, remove, clear, total, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function clampQty(qty: number) {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(999, Math.max(0, Math.trunc(qty)));
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}


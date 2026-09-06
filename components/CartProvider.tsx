"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { CartItem, ProductSnapshot } from "@/lib/types";

type CartContextType = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: ProductSnapshot, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "all-in-one-cart";

let cartItems: CartItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(next: CartItem[]) {
  cartItems = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (e.g. private mode)
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  try {
    cartItems = event.newValue ? (JSON.parse(event.newValue) as CartItem[]) : [];
  } catch {
    cartItems = [];
  }
  emit();
}

const EMPTY_CART: CartItem[] = [];

function getSnapshot(): CartItem[] {
  return cartItems;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

if (typeof window !== "undefined") {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CartItem[];
      // Purane format (bina snapshot ke) items ko drop karo
      if (
        Array.isArray(parsed) &&
        parsed.every((i) => typeof i.price === "number" && !!i.name)
      ) {
        cartItems = parsed;
      }
    }
  } catch {
    cartItems = [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((product: ProductSnapshot, quantity = 1) => {
    const existing = cartItems.find((i) => i.productId === product.id);
    if (existing) {
      persist(
        cartItems.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity, price: product.price }
            : i
        )
      );
    } else {
      persist([
        ...cartItems,
        {
          productId: product.id,
          quantity,
          slug: product.slug,
          name: product.name,
          category: product.category,
          price: product.price,
          emoji: product.emoji,
          gradient: product.gradient,
          imageUrl: product.imageUrl ?? null,
        },
      ]);
    }
  }, []);

  const removeItem = useCallback((productId: string) => {
    persist(cartItems.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      persist(cartItems.filter((i) => i.productId !== productId));
    } else {
      persist(
        cartItems.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, totalItems, subtotal, addItem, removeItem, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

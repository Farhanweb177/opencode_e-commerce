"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { ProductSnapshot } from "@/lib/types";

type WishlistContextType = {
  items: ProductSnapshot[];
  count: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: ProductSnapshot) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

const STORAGE_KEY = "all-in-one-wishlist";

let wishlistItems: ProductSnapshot[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(next: ProductSnapshot[]) {
  wishlistItems = next;
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
  return () => {
    listeners.delete(listener);
  };
}

const EMPTY: ProductSnapshot[] = [];

function getSnapshot(): ProductSnapshot[] {
  return wishlistItems;
}

function getServerSnapshot(): ProductSnapshot[] {
  return EMPTY;
}

if (typeof window !== "undefined") {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ProductSnapshot[];
      if (Array.isArray(parsed)) {
        wishlistItems = parsed;
      }
    }
  } catch {
    wishlistItems = [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isWishlisted = useCallback(
    (productId: string) =>
      wishlistItems.some((i) => i.id === productId),
    []
  );

  const toggleWishlist = useCallback((product: ProductSnapshot) => {
    const exists = wishlistItems.some((i) => i.id === product.id);
    persist(
      exists
        ? wishlistItems.filter((i) => i.id !== product.id)
        : [...wishlistItems, product]
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    persist(wishlistItems.filter((i) => i.id !== productId));
  }, []);

  const clearWishlist = useCallback(() => {
    persist([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isWishlisted,
      toggleWishlist,
      removeItem,
      clearWishlist,
    }),
    [items, isWishlisted, toggleWishlist, removeItem, clearWishlist]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return ctx;
}
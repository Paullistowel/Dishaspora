import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Currency, Listing } from '../types';

const CART_KEY = 'dishaspora.cart';

export interface CartItem {
  listing: Listing;
  qty: number;
}

/**
 * A cart can hold items from several vendors at once (meals from one kitchen,
 * ingredients from a grocer, etc.). Because the backend creates one order +
 * one payment per vendor, we expose the cart already grouped by vendor so the
 * cart/checkout screens can let the user pay each vendor in turn.
 */
export interface VendorGroup {
  vendorId: number;
  vendorName: string;
  currency: Currency;
  items: CartItem[];
  subtotalMinor: number;
  count: number;
}

interface CartContextValue {
  items: CartItem[];
  /** Items grouped by vendor, in first-added order. One order/payment per group. */
  groups: VendorGroup[];
  count: number;
  subtotalMinor: number;
  /** Add a listing (merges quantity if it's already in the cart). */
  add: (listing: Listing, qty?: number) => void;
  /** Add several listings at once (One-Click Basket / ingredient selection). */
  addAll: (rows: { listing: Listing; qty: number }[]) => void;
  setQty: (listingId: number, qty: number) => void;
  remove: (listingId: number) => void;
  /** Remove every item from one vendor — used after that vendor's order is paid. */
  removeVendor: (vendorId: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  // Don't write back to storage until the initial load has run, or we'd clobber a
  // saved cart with the empty starting state on first render.
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setItems(parsed);
        }
      } catch {
        // Corrupt/absent cart — start empty.
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(CART_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const mergeIn = useCallback(
    (prev: CartItem[], rows: { listing: Listing; qty: number }[]): CartItem[] => {
      const next = [...prev];
      for (const row of rows) {
        const i = next.findIndex((it) => it.listing.id === row.listing.id);
        if (i >= 0) next[i] = { ...next[i], qty: next[i].qty + row.qty };
        else next.push({ listing: row.listing, qty: row.qty });
      }
      return next;
    },
    []
  );

  const add = useCallback(
    (listing: Listing, qty = 1) => setItems((prev) => mergeIn(prev, [{ listing, qty }])),
    [mergeIn]
  );

  const addAll = useCallback(
    (rows: { listing: Listing; qty: number }[]) => {
      if (rows.length === 0) return;
      setItems((prev) => mergeIn(prev, rows));
    },
    [mergeIn]
  );

  const setQty = useCallback((listingId: number, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((it) => it.listing.id !== listingId)
        : prev.map((it) => (it.listing.id === listingId ? { ...it, qty } : it))
    );
  }, []);

  const remove = useCallback((listingId: number) => {
    setItems((prev) => prev.filter((it) => it.listing.id !== listingId));
  }, []);

  const removeVendor = useCallback((vendorId: number) => {
    setItems((prev) => prev.filter((it) => it.listing.vendorId !== vendorId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const groups = useMemo<VendorGroup[]>(() => {
    const map = new Map<number, VendorGroup>();
    for (const it of items) {
      const vId = it.listing.vendorId;
      let g = map.get(vId);
      if (!g) {
        g = {
          vendorId: vId,
          vendorName: it.listing.vendorName,
          currency: it.listing.currency,
          items: [],
          subtotalMinor: 0,
          count: 0,
        };
        map.set(vId, g);
      }
      g.items.push(it);
      g.subtotalMinor += it.listing.amountMinor * it.qty;
      g.count += it.qty;
    }
    return [...map.values()];
  }, [items]);

  const count = items.reduce((n, it) => n + it.qty, 0);
  const subtotalMinor = items.reduce((n, it) => n + it.qty * it.listing.amountMinor, 0);

  const value = useMemo(
    () => ({
      items,
      groups,
      count,
      subtotalMinor,
      add,
      addAll,
      setQty,
      remove,
      removeVendor,
      clear,
    }),
    [items, groups, count, subtotalMinor, add, addAll, setQty, remove, removeVendor, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

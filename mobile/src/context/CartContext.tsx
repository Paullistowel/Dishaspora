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

interface CartContextValue {
  items: CartItem[];
  /** id + name of the single vendor currently in the cart (one vendor per checkout). */
  vendorId: number | null;
  vendorName: string | null;
  currency: Currency | null;
  count: number;
  subtotalMinor: number;
  /**
   * Add a listing. Returns 'ok' or 'different-vendor' when the cart already
   * holds items from another vendor (caller should confirm & call replaceWith).
   */
  add: (listing: Listing, qty?: number) => 'ok' | 'different-vendor';
  /** Clears the cart and adds this listing (used after a different-vendor confirm). */
  replaceWith: (listing: Listing, qty?: number) => void;
  /** Adds several listings at once (One-Click Basket). Same vendor rule applies. */
  addAll: (rows: { listing: Listing; qty: number }[]) => 'ok' | 'different-vendor';
  replaceAllWith: (rows: { listing: Listing; qty: number }[]) => void;
  setQty: (listingId: number, qty: number) => void;
  remove: (listingId: number) => void;
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

  const vendorId = items.length > 0 ? items[0].listing.vendorId : null;
  const vendorName = items.length > 0 ? items[0].listing.vendorName : null;
  const currency = items.length > 0 ? items[0].listing.currency : null;

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
    (listing: Listing, qty = 1): 'ok' | 'different-vendor' => {
      if (vendorId !== null && listing.vendorId !== vendorId) return 'different-vendor';
      setItems((prev) => mergeIn(prev, [{ listing, qty }]));
      return 'ok';
    },
    [vendorId, mergeIn]
  );

  const replaceWith = useCallback(
    (listing: Listing, qty = 1) => setItems([{ listing, qty }]),
    []
  );

  const addAll = useCallback(
    (rows: { listing: Listing; qty: number }[]): 'ok' | 'different-vendor' => {
      if (rows.length === 0) return 'ok';
      const rowVendor = rows[0].listing.vendorId;
      if (vendorId !== null && rowVendor !== vendorId) return 'different-vendor';
      setItems((prev) => mergeIn(prev, rows));
      return 'ok';
    },
    [vendorId, mergeIn]
  );

  const replaceAllWith = useCallback(
    (rows: { listing: Listing; qty: number }[]) =>
      setItems(rows.map((r) => ({ listing: r.listing, qty: r.qty }))),
    []
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

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, it) => n + it.qty, 0);
  const subtotalMinor = items.reduce(
    (n, it) => n + it.qty * it.listing.amountMinor,
    0
  );

  const value = useMemo(
    () => ({
      items,
      vendorId,
      vendorName,
      currency,
      count,
      subtotalMinor,
      add,
      replaceWith,
      addAll,
      replaceAllWith,
      setQty,
      remove,
      clear,
    }),
    [items, vendorId, vendorName, currency, count, subtotalMinor, add, replaceWith, addAll, replaceAllWith, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

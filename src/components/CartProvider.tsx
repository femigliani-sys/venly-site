'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import type { CartItem, Product } from '@/lib/types';

const CART_KEY = 'venly_cart';

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };
type CartContext = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  add: (product: Product, size: string, quantity?: number) => boolean;
  setQuantity: (slug: string, size: string, quantity: number) => void;
  remove: (slug: string, size: string) => void;
  clear: () => void;
  notify: (message: string, type?: Toast['type']) => void;
};

const Context = createContext<CartContext | null>(null);
export function useCart() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((i) => i && typeof i.slug === 'string' && typeof i.quantity === 'number' && i.quantity > 0)
            .map((i) => ({ ...i, quantity: Math.min(20, Math.max(1, Math.floor(i.quantity))) })));
        }
      }
    } catch { /* ignore corrupt cart */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* storage full/blocked */ }
  }, [items, hydrated]);

  const notify = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((item) => item.id !== id)), 3600);
  }, []);

  const add = useCallback((product: Product, size: string, quantity = 1) => {
    if (!product.active || product.stock <= 0) { notify('Produto indisponível no momento.', 'error'); return false; }
    const chosen = product.sizes.length ? size : '';
    if (product.sizes.length && !product.sizes.includes(chosen)) { notify('Selecione um tamanho antes de continuar.', 'error'); return false; }
    setItems((current) => {
      const index = current.findIndex((i) => i.slug === product.slug && i.size === chosen);
      if (index >= 0) {
        const next = [...current];
        const total = Math.min(product.stock, next[index].quantity + quantity);
        next[index] = { ...next[index], quantity: total, stock: product.stock, price_cents: product.price_cents };
        return next;
      }
      return [...current, {
        slug: product.slug, name: product.name, image: product.images[0] || '', price_cents: product.price_cents,
        size: chosen, quantity: Math.min(product.stock, Math.max(1, quantity)), stock: product.stock,
      }];
    });
    notify(`${product.name} adicionado ao carrinho.`);
    return true;
  }, [notify]);

  const setQuantity = useCallback((slug: string, size: string, quantity: number) => {
    setItems((current) => current.map((i) => i.slug === slug && i.size === size
      ? { ...i, quantity: Math.max(1, Math.min(Math.min(i.stock || 20, 20), Math.floor(quantity))) } : i));
  }, []);

  const remove = useCallback((slug: string, size: string) => {
    setItems((current) => current.filter((i) => !(i.slug === slug && i.size === size)));
    notify('Item removido do carrinho.', 'info');
  }, [notify]);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContext>(() => ({
    items, count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.price_cents * i.quantity, 0),
    hydrated, add, setQuantity, remove, clear, notify,
  }), [items, hydrated, add, setQuantity, remove, clear, notify]);

  return (
    <Context.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} role="status"
            className="pointer-events-auto flex animate-fade-up items-center gap-3 rounded-sm border border-white/15 bg-[#12121d]/95 px-4 py-3.5 text-sm text-white shadow-2xl backdrop-blur-xl">
            {toast.type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0 text-red-400" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
            <span className="flex-1">{toast.message}</span>
            <button type="button" onClick={() => setToasts((t) => t.filter((i) => i.id !== toast.id))} aria-label="Fechar aviso" className="text-mist-500 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}

import { create } from 'zustand'

// ── Cart Store ──────────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (product) => {
    const items = get().items
    const existing = items.find(i => i.id === product.id)
    if (existing) {
      set({ items: items.map(i =>
        i.id === product.id ? { ...i, qty: i.qty + 1 } : i
      )})
    } else {
      set({ items: [...items, { ...product, qty: 1 }] })
    }
    set({ isOpen: true })
  },

  removeItem: (id) =>
    set({ items: get().items.filter(i => i.id !== id) }),

  updateQty: (id, qty) => {
    if (qty < 1) return get().removeItem(id)
    set({ items: get().items.map(i => i.id === id ? { ...i, qty } : i) })
  },

  clearCart: () => set({ items: [] }),

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  get total() {
    return get().items.reduce((sum, i) => sum + i.price * i.qty, 0)
  },
  get count() {
    return get().items.reduce((sum, i) => sum + i.qty, 0)
  },
}))

// ── API helper ──────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartService, productService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { unwrapList, productImage } from '@/utils/helpers'

// Normalise a backend cart row (cart_item_id + nested product) to a flat shape
// the cart UI + checkout already expect (id, product_id, name, image, price…).
function normalizeCartItem(ci) {
  const p = ci.product || {}
  return {
    id: ci.cart_item_id ?? ci.id,
    cart_item_id: ci.cart_item_id ?? ci.id,
    product_id: p.id ?? ci.product_id,
    product: p,
    name: p.name,
    image: productImage(p),
    price: Number(p.price ?? ci.price ?? 0),
    quantity: ci.quantity ?? 1,
    item_type: ci.item_type,
    subtotal: Number(ci.subtotal ?? 0),
    rental_start_date: ci.rental_start_date,
    rental_end_date: ci.rental_end_date,
  }
}

export const useCartStore = defineStore('cart', () => {
  const items    = ref([])
  const loading  = ref(false)
  const open     = ref(false)
  // Track which item IDs are currently being updated (for per-item spinner)
  const updating = ref(new Set())

  // ── Computed ─────────────────────────────────────────────────
  const totalItems = computed(() =>
    items.value.reduce((sum, i) => sum + (i.quantity || 1), 0)
  )

  // FIX: was summing i.price without × quantity
  // item.price = unit price; total = unit price × quantity
  const totalPrice = computed(() =>
    items.value.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0)
  )

  const isEmpty = computed(() => items.value.length === 0)

  function isUpdating(id) {
    return updating.value.has(id)
  }

  // ── Fetch ─────────────────────────────────────────────────────
  async function fetchCart() {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) { items.value = []; return }
    try {
      const res = await cartService.get()
      const rows = unwrapList(res).map(normalizeCartItem)
      // The cart's nested product omits the images relation, so hydrate images
      // in one batched request (/products?ids=…) — same trick as AI search.
      await hydrateImages(rows)
      items.value = rows
    } catch (_) {
      items.value = []
    }
  }

  async function hydrateImages(rows) {
    const ids = [...new Set(rows.map(r => r.product_id).filter(Boolean))]
    if (!ids.length) return
    try {
      const res = await productService.getAll({ ids: ids.join(','), per_page: ids.length })
      const byId = {}
      unwrapList(res).forEach(p => { byId[p.id] = p })
      rows.forEach(r => {
        const full = byId[r.product_id]
        if (full) { r.product = full; r.image = productImage(full) }
      })
    } catch (_) { /* keep whatever images we have */ }
  }

  // ── Add ───────────────────────────────────────────────────────
  async function addItem(productId, quantity = 1) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) return { success: false, message: 'Please sign in' }
    loading.value = true
    try {
      // Backend requires user_id + item_type.
      await cartService.addItem({ user_id: auth.user.id, product_id: productId, quantity, item_type: 'purchase' })
      await fetchCart()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add item' }
    } finally {
      loading.value = false
    }
  }

  async function addRental(productId, startDate, endDate) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) return { success: false, message: 'Please sign in' }
    loading.value = true
    try {
      await cartService.addItem({
        user_id: auth.user.id, product_id: productId, quantity: 1,
        item_type: 'rental', rental_start_date: startDate, rental_end_date: endDate,
      })
      await fetchCart()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add rental' }
    } finally {
      loading.value = false
    }
  }

  // ── Update quantity ───────────────────────────────────────────
  async function updateItem(id, quantity) {
    // If quantity drops to 0, remove the item entirely
    if (quantity < 1) {
      return removeItem(id)
    }

    // Mark this item as updating
    updating.value = new Set([...updating.value, id])

    // FIX: optimistic update — change quantity immediately so UI responds instantly
    const item = items.value.find(i => i.id === id)
    // Never exceed the product's available stock.
    const maxQ = Number(item?.product?.quantity) || 0
    if (maxQ > 0 && quantity > maxQ) quantity = maxQ
    const prevQty = item?.quantity
    if (item) item.quantity = quantity

    try {
      await cartService.updateItem(id, { quantity })
      // Sync with backend to get accurate price/totals
      await fetchCart()
    } catch (_) {
      // Roll back optimistic update on failure
      if (item && prevQty !== undefined) item.quantity = prevQty
    } finally {
      const next = new Set(updating.value)
      next.delete(id)
      updating.value = next
    }
  }

  // ── Remove ────────────────────────────────────────────────────
  async function removeItem(id) {
    // Optimistic: remove from list immediately
    const prev = [...items.value]
    items.value = items.value.filter(i => i.id !== id)
    try {
      await cartService.removeItem(id)
    } catch (_) {
      // Roll back on failure
      items.value = prev
    }
  }

  // ── Clear ─────────────────────────────────────────────────────
  async function clearCart() {
    const auth = useAuthStore()
    const prev = [...items.value]
    items.value = []
    try {
      await cartService.clear(auth.user?.id)
    } catch (_) {
      items.value = prev
    }
  }

  function openCart()  { open.value = true  }
  function closeCart() { open.value = false }

  return {
    items, loading, open,
    totalItems, totalPrice, isEmpty,
    isUpdating,
    fetchCart, addItem, addRental, updateItem, removeItem, clearCart,
    openCart, closeCart,
  }
})

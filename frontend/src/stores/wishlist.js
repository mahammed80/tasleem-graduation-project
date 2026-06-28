import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wishlistService, productService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { unwrapList } from '@/utils/helpers'

export const useWishlistStore = defineStore('wishlist', () => {
  const items   = ref([])
  const loading = ref(false)

  // Map of product_id → wishlist row id (the API uses `wishlist_id`, nested product)
  const itemMap = computed(() => {
    const m = {}
    items.value.forEach(i => { m[i.product?.id ?? i.product_id] = i.wishlist_id ?? i.id })
    return m
  })

  const ids   = computed(() => Object.keys(itemMap.value).map(Number))
  const count = computed(() => items.value.length)

  function isInWishlist(productId) {
    return ids.value.includes(Number(productId))
  }

  async function fetchWishlist() {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) { items.value = []; return }
    try {
      const res = await wishlistService.getAll({ user_id: auth.user?.id, per_page: 100 })
      const rows = res.data?.data || res.data || []
      // Wishlist's nested product omits images — hydrate them in one batched request.
      const ids = [...new Set(rows.map(r => r.product?.id ?? r.product_id).filter(Boolean))]
      if (ids.length) {
        try {
          const pr = await productService.getAll({ ids: ids.join(','), per_page: ids.length })
          const byId = {}
          unwrapList(pr).forEach(p => { byId[p.id] = p })
          rows.forEach(r => {
            const full = byId[r.product?.id ?? r.product_id]
            if (full) r.product = full
          })
        } catch (_) { /* keep as-is */ }
      }
      items.value = rows
    } catch (_) {
      items.value = []
    }
  }

  async function toggle(productId) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) return { needsAuth: true }
    loading.value = true
    try {
      if (isInWishlist(productId)) {
        const wishlistItemId = itemMap.value[productId]
        await wishlistService.remove(wishlistItemId)
        items.value = items.value.filter(i => (i.wishlist_id ?? i.id) !== wishlistItemId)
        return { added: false }
      } else {
        // Backend requires user_id.
        await wishlistService.add({ user_id: auth.user.id, product_id: productId })
        await fetchWishlist()
        return { added: true }
      }
    } catch (err) {
      return { error: err.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  async function remove(productId) {
    const wishlistItemId = itemMap.value[productId]
    if (!wishlistItemId) return
    try {
      await wishlistService.remove(wishlistItemId)
      items.value = items.value.filter(i => i.id !== wishlistItemId)
    } catch (_) {}
  }

  async function clearAll() {
    const auth = useAuthStore()
    try {
      // ✅ Fixed: backend needs DELETE /wishlist/clear/{userId}
      await wishlistService.clear(auth.user?.id)
      items.value = []
    } catch (_) {
      items.value = []
    }
  }

  return { items, loading, ids, count, isInWishlist, fetchWishlist, toggle, remove, clearAll }
})

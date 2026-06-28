import { defineStore } from 'pinia'
import { ref } from 'vue'
import { offerService } from '@/services/api'
import { unwrapList } from '@/utils/helpers'
import { useAuthStore } from '@/stores/auth'

export const useOffersStore = defineStore('offers', () => {
  const received = ref([]) // offers on MY listings (I'm the seller)
  const sent = ref([])     // offers I made (I'm the buyer)
  const loading = ref(false)

  async function fetchAll() {
    const me = useAuthStore().user?.id
    if (!me) return
    loading.value = true
    try {
      const [r, s] = await Promise.all([
        offerService.received(me).catch(() => null),
        offerService.sent(me).catch(() => null),
      ])
      // Server filters can be loose — keep only the rows that are really mine.
      received.value = unwrapList(r).filter(o => (o.seller_id ?? o.seller?.id ?? o.product?.owner?.id) === me)
      sent.value = unwrapList(s).filter(o => (o.buyer_id ?? o.buyer?.id) === me)
    } catch (_) {
      // leave previous values
    } finally {
      loading.value = false
    }
  }

  async function make(data)  { await offerService.make(data) }
  async function accept(id)  { const res = await offerService.accept(id); await fetchAll(); return res }
  async function reject(id)  { await offerService.reject(id); await fetchAll() }

  return { received, sent, loading, fetchAll, make, accept, reject }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { walletService } from '@/services/api'
import { unwrap } from '@/utils/helpers'

export const useWalletStore = defineStore('wallet', () => {
  const balance = ref(0)
  const transactions = ref([])
  const loading = ref(false)
  const available = ref(true) // false → /wallet endpoint not reachable

  async function fetch() {
    loading.value = true
    try {
      const res = await walletService.get()
      const d = unwrap(res) || {}
      balance.value = Number(d.balance ?? 0)
      transactions.value = d.transactions || []
      available.value = true
    } catch (_) {
      available.value = false
    } finally {
      loading.value = false
    }
  }

  async function topup(amount) {
    await walletService.topup(amount)
    await fetch()
  }

  return { balance, transactions, loading, available, fetch, topup }
})

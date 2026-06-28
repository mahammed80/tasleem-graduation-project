import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export const useNotificationStore = defineStore('notifications', () => {
  const items       = ref([])
  const loading     = ref(false)
  let   pollTimer   = null

  const unreadCount = computed(() => items.value.filter(n => !n.read_at).length)
  const hasUnread   = computed(() => unreadCount.value > 0)

  async function fetchAll() {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) return
    loading.value = true
    try {
      const res = await notificationService.getAll()
      // Backend shape: { data: { notifications: [...], unread_count } }
      const d = res.data?.data || res.data || {}
      items.value = d.notifications || d.data || (Array.isArray(d) ? d : [])
    } catch (_) {
      // Notifications endpoint may not exist yet — fail silently
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function markRead(id) {
    try {
      await notificationService.markRead(id)
      const n = items.value.find(n => n.id === id)
      if (n) n.read_at = new Date().toISOString()
    } catch (_) {}
  }

  async function markAllRead() {
    try {
      await notificationService.markAllRead()
      items.value.forEach(n => { if (!n.read_at) n.read_at = new Date().toISOString() })
    } catch (_) {}
  }

  function startPolling(intervalMs = 60000) {
    fetchAll()
    pollTimer = setInterval(fetchAll, intervalMs)
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }

  return { items, loading, unreadCount, hasUnread, fetchAll, markRead, markAllRead, startPolling, stopPolling }
})

<template>
  <div class="position-relative" ref="wrapRef">
    <button
      class="nav-link border-0 bg-transparent position-relative px-2"
      @click="toggle"
      title="Notifications"
    >
      <i class="bi bi-bell fs-5"></i>
      <span
        v-if="store.hasUnread"
        class="position-absolute"
        style="top:2px;right:4px;width:9px;height:9px;background:#e74c3c;border-radius:50%;border:2px solid var(--navy-mid);"
      ></span>
    </button>

    <Transition name="fade">
      <div v-if="open" class="notif-dropdown">
        <div class="d-flex align-items-center justify-content-between px-3 py-2" style="border-bottom:1px solid var(--navy-border);">
          <span class="text-cream fw-600" style="font-size:.88rem;">
            Notifications
            <span class="badge badge-gold ms-1" v-if="store.unreadCount > 0">{{ store.unreadCount }}</span>
          </span>
          <button v-if="store.hasUnread" class="btn btn-link text-gold p-0 text-decoration-none" style="font-size:.78rem;" @click="store.markAllRead()">
            Mark all read
          </button>
        </div>

        <div style="max-height:360px;overflow-y:auto;">
          <div v-if="store.loading" class="p-3">
            <div class="skeleton mb-2" style="height:50px;" v-for="n in 3" :key="n"></div>
          </div>
          <div v-else-if="store.items.length === 0" class="text-center py-4">
            <i class="bi bi-bell-slash text-muted d-block" style="font-size:2rem;"></i>
            <span class="text-muted d-block mt-1" style="font-size:.83rem;">No notifications</span>
          </div>
          <div v-else>
            <div
              v-for="n in store.items.slice(0, 10)"
              :key="n.id"
              class="notif-item"
              :class="{ unread: !n.read_at }"
              @click="handleClick(n)"
            >
              <div class="d-flex gap-2 align-items-start">
                <div class="notif-icon" :class="typeClass(n.type)">
                  <i :class="typeIcon(n.type)"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                  <p class="text-cream mb-0" style="font-size:.83rem;font-weight:500;line-height:1.3;">{{ n.title || n.data?.title || 'Notification' }}</p>
                  <p class="text-muted mb-0" style="font-size:.76rem;line-height:1.35;">{{ n.body || n.message || n.data?.message }}</p>
                  <span class="text-muted" style="font-size:.7rem;">{{ timeAgo(n.created_at) }}</span>
                </div>
                <div v-if="!n.read_at" style="width:7px;height:7px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:5px;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-2 text-center" style="border-top:1px solid var(--navy-border);">
          <RouterLink class="btn btn-link text-gold text-decoration-none p-0" style="font-size:.8rem;" to="/profile" @click="open = false">
            View all notifications →
          </RouterLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notifications'

const store = useNotificationStore()
const router = useRouter()
const open = ref(false)
const wrapRef = ref(null)

function toggle() { open.value = !open.value }

function handleClick(n) {
  store.markRead(n.id)
  open.value = false
  router.push(routeFor(n) || '/profile')
}

// Build the destination from the notification's ref_type + ref_id.
function routeFor(n) {
  const t = (n.ref_type || n.data?.ref_type || '').toLowerCase()
  const id = n.ref_id || n.data?.ref_id
  if (t === 'order' && id) return `/orders/${id}`
  if (t === 'offer') return '/offers'
  if (t === 'rental') return '/rentals'
  if (t === 'product' && id) return `/products/${id}`
  // Fall back by notification type keyword.
  const type = (n.type || '').toLowerCase()
  if (type.includes('offer')) return '/offers'
  if (type.includes('order') && id) return `/orders/${id}`
  if (type.includes('boost') || type.includes('wallet')) return '/wallet'
  return null
}

// Types arrive as 'order_placed', 'offer_received', etc. — match by keyword.
function typeClass(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('order')) return 't-order'
  if (t.includes('pay') || t.includes('wallet')) return 't-payment'
  if (t.includes('review')) return 't-review'
  if (t.includes('rental') || t.includes('offer')) return 't-rental'
  return 't-system'
}
function typeIcon(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('order')) return 'bi bi-bag-check'
  if (t.includes('pay') || t.includes('wallet')) return 'bi bi-credit-card'
  if (t.includes('review')) return 'bi bi-star'
  if (t.includes('offer')) return 'bi bi-tag'
  if (t.includes('rental')) return 'bi bi-clock-history'
  return 'bi bi-bell'
}
function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function handleOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', handleOutside, true))
onBeforeUnmount(() => document.removeEventListener('click', handleOutside, true))
</script>

<style scoped>
.notif-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 300px;
  background: var(--navy-card);
  border: 1px solid var(--navy-border);
  border-radius: 1rem;
  box-shadow: 0 8px 40px rgba(0,0,0,.45);
  z-index: 1050; overflow: hidden;
}
@media (max-width: 480px) { .notif-dropdown { width: calc(100vw - 2rem); right: -0.5rem; } }

.notif-item {
  padding: .65rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(201,169,110,.04);
  transition: background .12s;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: rgba(201,169,110,.05); }
.notif-item.unread { background: rgba(201,169,110,.04); }

.notif-icon {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; flex-shrink: 0;
}
.t-order   { background: rgba(46,204,113,.12);  color: #2ecc71; }
.t-payment { background: rgba(155,89,182,.12);  color: #9b59b6; }
.t-review  { background: rgba(201,169,110,.12); color: var(--gold); }
.t-rental  { background: rgba(52,152,219,.12);  color: #3498db; }
.t-system  { background: rgba(201,169,110,.1);  color: var(--gold); }
</style>

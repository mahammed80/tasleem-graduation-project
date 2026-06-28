<template>
  <div v-if="isEnabled" class="mock-bar">
    <div class="mock-bar-inner" :class="{ expanded }">

      <!-- Collapsed pill -->
      <button class="mock-pill" @click="expanded = !expanded" title="Mock API controls">
        <span class="dot"></span>
        <span class="label">MOCK</span>
        <i class="bi" :class="expanded ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
      </button>

      <!-- Expanded panel -->
      <Transition name="slide-up">
        <div v-if="expanded" class="mock-panel">
          <div class="mock-panel-header">
            <span>🎭 Mock API Active</span>
            <button class="close-btn" @click="expanded = false">×</button>
          </div>

          <!-- Quick login -->
          <div class="section-label">Quick Login</div>
          <div class="user-list">
            <button
              v-for="u in quickUsers"
              :key="u.email"
              class="user-btn"
              :class="{ active: currentUser?.email === u.email }"
              @click="quickLogin(u)"
              :disabled="loading"
            >
              <div class="avatar">{{ u.initials }}</div>
              <div class="info">
                <div class="name">{{ u.name }}</div>
                <div class="role">{{ u.role }}</div>
              </div>
              <i class="bi bi-check2 check" v-if="currentUser?.email === u.email"></i>
            </button>
          </div>

          <!-- State info -->
          <div class="section-label mt-2">State</div>
          <div class="state-grid">
            <div class="state-item">
              <span class="state-val">{{ productCount }}</span>
              <span class="state-key">Products</span>
            </div>
            <div class="state-item">
              <span class="state-val">{{ orderCount }}</span>
              <span class="state-key">Orders</span>
            </div>
            <div class="state-item">
              <span class="state-val">{{ cartCount }}</span>
              <span class="state-key">Cart</span>
            </div>
            <div class="state-item">
              <span class="state-val">{{ wishlistCount }}</span>
              <span class="state-key">Wishlist</span>
            </div>
          </div>

          <!-- Reset button -->
          <button class="reset-btn" @click="resetState">
            <i class="bi bi-arrow-counterclockwise me-1"></i>Reset Mock State
          </button>

          <div class="hint">
            Disable: set <code>VITE_USE_MOCKS=false</code>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const isEnabled = import.meta.env.VITE_USE_MOCKS === 'true'

const auth      = useAuthStore()
const cart      = useCartStore()
const wishlist  = useWishlistStore()
const toast     = useToast()
const router    = useRouter()
const expanded  = ref(false)
const loading   = ref(false)

const currentUser = computed(() => auth.user)
const productCount = computed(() => window.__tasleemMockState?.products?.length ?? '—')
const orderCount   = computed(() => window.__tasleemMockState?.orders?.length   ?? '—')
const cartCount    = computed(() => window.__tasleemMockState?.cartItems?.length ?? '—')
const wishlistCount= computed(() => window.__tasleemMockState?.wishlist?.length  ?? '—')

const quickUsers = [
  { name: 'Ahmed (Buyer)',  email: 'ahmed@example.com',  password: 'any', role: 'user',   initials: 'AB' },
  { name: 'Nour (Seller)',  email: 'nour@example.com',   password: 'any', role: 'seller', initials: 'NS' },
  { name: 'Omar (Admin)',   email: 'omar@example.com',   password: 'any', role: 'admin',  initials: 'OA' },
  { name: 'Karim (Seller)', email: 'karim@example.com',  password: 'any', role: 'seller', initials: 'KS' },
]

async function quickLogin(u) {
  loading.value = true
  try {
    await auth.logout()
    const res = await auth.login({ email: u.email, password: u.password })
    if (res.success) {
      await Promise.all([cart.fetchCart(), wishlist.fetchWishlist()])
      toast.success(`Switched to ${u.name}`)
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}

function resetState() {
  if (window.__tasleemMockState) {
    toast.info('Mock state reset — reload the page')
    setTimeout(() => window.location.reload(), 800)
  }
}
</script>

<style scoped>
.mock-bar {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 9999;
}
@media (min-width: 992px) {
  .mock-bar { bottom: 16px; }
}

.mock-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1a0a2e;
  border: 1px solid #7c3aed;
  border-radius: 2rem;
  padding: 5px 12px 5px 8px;
  color: #c4b5fd;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .08em;
  cursor: pointer;
  transition: all .2s;
  box-shadow: 0 2px 12px rgba(124,58,237,.35);
}
.mock-pill:hover { background: #2d1a4e; border-color: #a78bfa; }
.dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #a78bfa;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
.label { font-family: monospace; }

.mock-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 260px;
  background: #0f0a1e;
  border: 1px solid #4c1d95;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,.6), 0 0 0 1px rgba(124,58,237,.2);
}
.mock-panel-header {
  background: linear-gradient(135deg, #1e0a3c, #2d1a4e);
  padding: .6rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #c4b5fd;
  font-size: .8rem;
  font-weight: 700;
  border-bottom: 1px solid #4c1d95;
}
.close-btn { background: none; border: none; color: #9ca3af; font-size: 1.2rem; cursor: pointer; line-height: 1; padding: 0; }
.close-btn:hover { color: #c4b5fd; }

.section-label {
  font-size: .65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: #7c3aed;
  padding: .5rem 1rem .25rem;
}
.mt-2 { margin-top: .25rem; }

.user-list { padding: 0 .5rem .5rem; display: flex; flex-direction: column; gap: 2px; }
.user-btn {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .4rem .6rem;
  border-radius: .5rem;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all .15s;
  text-align: left;
  width: 100%;
}
.user-btn:hover { background: rgba(124,58,237,.15); border-color: rgba(124,58,237,.3); }
.user-btn.active { background: rgba(124,58,237,.2); border-color: #7c3aed; }
.user-btn:disabled { opacity: .5; cursor: not-allowed; }
.avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #4c1d95, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.info { flex-grow: 1; }
.name { color: #e9d5ff; font-size: .78rem; font-weight: 500; line-height: 1.2; }
.role { color: #7c3aed; font-size: .65rem; }
.check { color: #a78bfa; font-size: .8rem; }

.state-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 0 .5rem .5rem;
}
.state-item {
  background: rgba(124,58,237,.08);
  border: 1px solid rgba(124,58,237,.2);
  border-radius: .5rem;
  padding: .35rem .5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.state-val { color: #c4b5fd; font-size: .9rem; font-weight: 700; line-height: 1; }
.state-key { color: #6b7280; font-size: .6rem; margin-top: 1px; }

.reset-btn {
  width: calc(100% - 1rem);
  margin: 0 .5rem .5rem;
  padding: .4rem;
  border-radius: .5rem;
  background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.25);
  color: #fca5a5;
  font-size: .75rem;
  cursor: pointer;
  transition: all .15s;
}
.reset-btn:hover { background: rgba(239,68,68,.2); }

.hint {
  padding: .4rem 1rem .6rem;
  font-size: .65rem;
  color: #4b5563;
  text-align: center;
}
.hint code { color: #7c3aed; background: rgba(124,58,237,.1); padding: 1px 4px; border-radius: 3px; }

.slide-up-enter-active, .slide-up-leave-active { transition: all .2s cubic-bezier(.4,0,.2,1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(8px); }
</style>

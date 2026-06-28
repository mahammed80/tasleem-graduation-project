<template>
  <nav class="navbar navbar-tasleem navbar-expand-lg sticky-top">
    <div class="container">
      <!-- Brand -->
      <RouterLink class="navbar-brand" to="/">تسليم<span>.</span></RouterLink>

      <!-- Mobile right actions -->
      <div class="d-flex align-items-center gap-1 d-lg-none">
        <NotificationBell v-if="auth.isAuthenticated" />
        <button class="btn btn-sm p-1 cart-badge text-cream position-relative" @click="cart.openCart()" v-if="auth.isAuthenticated">
          <i class="bi bi-bag fs-5"></i>
          <span class="badge" v-if="cart.totalItems > 0">{{ cart.totalItems }}</span>
        </button>
        <button class="navbar-toggler border-0 p-1" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
          <i class="bi bi-list fs-4 text-cream"></i>
        </button>
      </div>

      <div class="collapse navbar-collapse" id="navbarMain">
        <!-- AI Search -->
        <div class="ai-search-wrap d-flex mx-lg-4 my-2 my-lg-0 flex-grow-1 position-relative" ref="aiSearchWrap">
          <div class="input-group">
            <span class="input-group-text ai-search-prefix">
              <i class="bi bi-stars text-gold"></i>
            </span>
            <input
              class="form-control ai-search-input"
              type="text"
              placeholder="Ask AI to find products…"
              v-model="aiQuery"
              @keydown.enter="askAssistant"
              @input="showResults = false"
              :disabled="assistantLoading"
            />
            <button class="btn btn-gold ai-search-btn" @click="askAssistant" :disabled="assistantLoading || !aiQuery.trim()">
              <span class="spinner-border spinner-border-sm" v-if="assistantLoading"></span>
              <i class="bi bi-send-fill" v-else></i>
            </button>
          </div>

          <!-- AI Results Dropdown -->
          <Transition name="fade">
            <div v-if="showResults && (assistantAnswer || assistantProducts.length > 0)" class="ai-results-dropdown">
              <p v-if="assistantAnswer" class="ai-answer mb-2">
                <i class="bi bi-robot text-gold me-2"></i>{{ assistantAnswer }}
              </p>
              <div v-if="assistantProducts.length > 0" class="d-flex flex-column gap-1">
                <RouterLink
                  v-for="p in assistantProducts.slice(0, 4)"
                  :key="p.id"
                  :to="`/products/${p.id}`"
                  class="ai-product-item"
                  @click="showResults = false; aiQuery = ''"
                >
                  <div class="ai-product-img-wrap">
                    <img v-if="p.image" :src="p.image" />
                    <i v-else class="bi bi-image text-muted" style="font-size:.8rem;"></i>
                  </div>
                  <div class="flex-grow-1 min-w-0">
                    <div class="text-cream text-truncate" style="font-size:.82rem;font-weight:500;">{{ p.name }}</div>
                    <div class="text-gold" style="font-size:.76rem;">{{ formatPrice(p.price) }}</div>
                  </div>
                </RouterLink>
              </div>
              <button class="btn btn-gold btn-sm w-100 mt-2" style="font-size:.78rem;" @click="goToSearch" v-if="aiQuery.trim()">
                <i class="bi bi-search me-1"></i>See all results for "{{ aiQuery.trim() }}"
              </button>
              <button class="btn btn-link text-muted p-0 mt-2" style="font-size:.73rem;" @click="showResults = false; aiQuery = ''">
                <i class="bi bi-x me-1"></i>Clear
              </button>
            </div>
          </Transition>
        </div>

        <ul class="navbar-nav align-items-lg-center gap-1">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/products">Products</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/categories">Categories</RouterLink>
          </li>

          <!-- Guest buttons -->
          <template v-if="!auth.isAuthenticated">
            <li class="nav-item ms-lg-2">
              <RouterLink class="btn btn-outline-gold btn-sm px-3" to="/login">Sign In</RouterLink>
            </li>
            <li class="nav-item ms-1">
              <RouterLink class="btn btn-gold btn-sm px-3" to="/register">Get Started</RouterLink>
            </li>
          </template>

          <!-- Authenticated -->
          <template v-else>
            <!-- Seller dashboard -->
            <li class="nav-item" v-if="auth.isSeller">
              <RouterLink class="nav-link" to="/seller">
                <i class="bi bi-shop me-1"></i>Sell
              </RouterLink>
            </li>

            <!-- Admin link -->
            <li class="nav-item" v-if="auth.isAdmin">
              <RouterLink class="nav-link" to="/admin">
                <i class="bi bi-shield-check me-1"></i>Admin
              </RouterLink>
            </li>

            <!-- Notifications (desktop) -->
            <li class="nav-item d-none d-lg-flex align-items-center">
              <NotificationBell />
            </li>

            <!-- Wishlist -->
            <li class="nav-item d-none d-lg-flex align-items-center">
              <RouterLink class="nav-link position-relative px-2" to="/wishlist">
                <i class="bi bi-heart fs-5"></i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size:.55rem;padding:.25em .4em;" v-if="wishlist.count > 0">{{ wishlist.count }}</span>
              </RouterLink>
            </li>

            <!-- Cart -->
            <li class="nav-item d-none d-lg-flex align-items-center">
              <button class="nav-link cart-badge border-0 bg-transparent position-relative px-2" @click="cart.openCart()">
                <i class="bi bi-bag fs-5"></i>
                <span class="badge" v-if="cart.totalItems > 0">{{ cart.totalItems }}</span>
              </button>
            </li>

            <!-- Profile dropdown -->
            <li class="nav-item dropdown ms-lg-1">
              <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" data-bs-toggle="dropdown">
                <div class="user-avatar">{{ initials }}</div>
              </a>
              <ul class="dropdown-menu dropdown-menu-end" style="min-width:220px;">
                <li class="px-3 py-2">
                  <div class="text-cream fw-600" style="font-size:.9rem;">{{ auth.fullName }}</div>
                  <div class="text-muted" style="font-size:.78rem;">{{ auth.user?.email }}</div>
                  <span class="badge mt-1" :class="roleBadge">{{ auth.user?.role || 'user' }}</span>
                </li>
                <li><hr class="dropdown-divider m-1" style="border-color:var(--navy-border);" /></li>
                <li><RouterLink class="dropdown-item" to="/profile"><i class="bi bi-person me-2"></i>My Profile</RouterLink></li>
                <li><RouterLink class="dropdown-item" to="/orders"><i class="bi bi-bag-check me-2"></i>My Orders</RouterLink></li>
                <li><RouterLink class="dropdown-item" to="/rentals"><i class="bi bi-clock-history me-2"></i>My Rentals</RouterLink></li>
                <li><RouterLink class="dropdown-item" to="/wallet"><i class="bi bi-wallet2 me-2"></i>My Wallet</RouterLink></li>
                <li><RouterLink class="dropdown-item" to="/offers"><i class="bi bi-tag me-2"></i>Offers</RouterLink></li>
                <li><RouterLink class="dropdown-item" to="/wishlist"><i class="bi bi-heart me-2"></i>Wishlist</RouterLink></li>
                <template v-if="auth.isSeller">
                  <li><hr class="dropdown-divider m-1" style="border-color:var(--navy-border);" /></li>
                  <li><RouterLink class="dropdown-item text-gold" to="/seller"><i class="bi bi-shop me-2"></i>Seller Dashboard</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/seller/sales"><i class="bi bi-graph-up-arrow me-2"></i>My Sales</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/seller/products/new"><i class="bi bi-plus-circle me-2"></i>List a Product</RouterLink></li>
                </template>
                <template v-if="auth.isAdmin">
                  <li><hr class="dropdown-divider m-1" style="border-color:var(--navy-border);" /></li>
                  <li><RouterLink class="dropdown-item" to="/admin"><i class="bi bi-shield-check me-2"></i>Admin Panel</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/admin/products"><i class="bi bi-box-seam me-2"></i>Manage Products</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/admin/orders"><i class="bi bi-bag-check me-2"></i>Manage Orders</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/admin/users"><i class="bi bi-people me-2"></i>Manage Users</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/admin/logs"><i class="bi bi-journal-code me-2"></i>Activity Logs</RouterLink></li>
                </template>
                <li><hr class="dropdown-divider m-1" style="border-color:var(--navy-border);" /></li>
                <li>
                  <button class="dropdown-item text-danger" @click="handleLogout">
                    <i class="bi bi-box-arrow-right me-2"></i>Sign Out
                  </button>
                </li>
              </ul>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useToast } from 'vue-toastification'
import { aiSearch } from '@/services/ai'
import { productImage } from '@/utils/helpers'
import NotificationBell from '@/components/ui/NotificationBell.vue'

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToast()

// AI Search state
const aiQuery = ref('')
const assistantLoading = ref(false)
const assistantAnswer = ref('')
const assistantProducts = ref([])
const showResults = ref(false)
const aiSearchWrap = ref(null)

const initials = computed(() =>
  (auth.fullName || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
)

const roleBadge = computed(() => {
  const m = { admin: 'bg-danger', seller: 'bg-warning text-dark', user: 'badge-gold' }
  return m[auth.user?.role] || 'badge-gold'
})

function formatPrice(v) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(v || 0)
}

async function askAssistant() {
  const q = aiQuery.value.trim()
  if (!q || assistantLoading.value) return
  assistantLoading.value = true
  assistantAnswer.value = ''
  assistantProducts.value = []
  showResults.value = false
  try {
    // AI semantic search → ranked products (hydrated from the catalogue).
    const products = await aiSearch(q, 8)
    if (products && products.length) {
      assistantProducts.value = products.map(p => ({
        id: p.id, name: p.name, price: p.price, image: productImage(p),
      }))
      assistantAnswer.value = `Found ${products.length} match${products.length > 1 ? 'es' : ''} for "${q}"`
    } else {
      // AI returned nothing / unavailable → let the user open full results.
      assistantAnswer.value = `No quick matches — press “See all results” to search “${q}”.`
    }
    showResults.value = true
  } catch (_) {
    assistantAnswer.value = 'AI search is temporarily unavailable.'
    showResults.value = true
  } finally {
    assistantLoading.value = false
  }
}

// Enter / send button shows the quick AI dropdown; this opens the full
// results on the Products page (AI-ranked).
function goToSearch() {
  const q = aiQuery.value.trim()
  if (!q) return
  showResults.value = false
  router.push({ path: '/products', query: { search: q } })
}

function handleOutsideClick(e) {
  if (aiSearchWrap.value && !aiSearchWrap.value.contains(e.target)) {
    showResults.value = false
  }
}

async function handleLogout() {
  await auth.logout()
  cart.items = []
  wishlist.items = []
  toast.info('Signed out successfully')
  router.push('/')
}

onMounted(() => document.addEventListener('click', handleOutsideClick, true))
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick, true))
</script>

<style scoped>
.user-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-dark), var(--gold));
  display: flex; align-items: center; justify-content: center;
  font-size: .78rem; font-weight: 700; color: var(--navy);
  border: 2px solid rgba(201,169,110,.4);
}

/* AI Search */
.ai-search-wrap {
  max-width: 420px;
}
.ai-search-prefix {
  background: var(--navy-light);
  border-color: var(--navy-border);
  border-right: none;
}
.ai-search-input {
  border-left: none !important;
  border-radius: 0 !important;
}
.ai-search-input:focus {
  border-color: var(--gold) !important;
  box-shadow: none !important;
}
.ai-search-input:focus ~ .ai-search-btn,
.ai-search-input:focus + .ai-search-btn {
  border-color: var(--gold);
}
.ai-search-btn {
  border-radius: 0 2rem 2rem 0;
  padding: 0 .9rem;
}
.ai-search-prefix {
  border-radius: 2rem 0 0 2rem;
}

/* Results Dropdown */
.ai-results-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--navy-card);
  border: 1px solid var(--navy-border);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
  padding: .85rem 1rem;
  z-index: 1200;
  max-height: 420px;
  overflow-y: auto;
}
.ai-answer {
  font-size: .83rem;
  color: var(--text-main);
  line-height: 1.55;
  margin: 0;
  padding-bottom: .5rem;
  border-bottom: 1px solid var(--navy-border);
}
.ai-product-item {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .45rem .5rem;
  border-radius: .6rem;
  text-decoration: none;
  transition: background .12s;
}
.ai-product-item:hover {
  background: rgba(201,169,110,.07);
}
.ai-product-img-wrap {
  width: 38px; height: 38px;
  border-radius: .5rem;
  overflow: hidden;
  background: var(--navy-light);
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.ai-product-img-wrap img {
  width: 100%; height: 100%; object-fit: cover;
}
</style>
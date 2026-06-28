<template>
  <div>
    <div class="page-header">
      <div class="container">
        <div class="d-flex align-items-center gap-4">
          <div class="profile-avatar">{{ initials }}</div>
          <div>
            <h2 class="text-cream mb-1">{{ auth.fullName }}</h2>
            <p class="text-muted mb-0" style="font-size:.9rem;">{{ auth.user?.email }}</p>
            <div class="d-flex align-items-center gap-2 mt-1 flex-wrap">
              <span class="badge badge-gold">{{ auth.user?.role || 'User' }}</span>
              <span v-if="auth.user?.national_id" class="badge bg-secondary" style="font-size:.72rem;" title="National ID (locked)">
                <i class="bi bi-person-vcard me-1"></i>ID ••••{{ String(auth.user.national_id).slice(-4) }}
              </span>
              <TrustBadge :user="auth.user" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <div class="row g-4">
        <!-- Sidebar nav -->
        <div class="col-lg-3">
          <div class="card p-2 mb-3">
            <ul class="nav nav-pills flex-column gap-1">
              <li class="nav-item" v-for="tab in tabs" :key="tab.key">
                <button
                  class="nav-link w-100 text-start d-flex align-items-center gap-2"
                  :class="{ active: activeTab === tab.key }"
                  @click="activeTab = tab.key"
                >
                  <i :class="tab.icon"></i>
                  {{ tab.label }}
                </button>
              </li>
            </ul>
          </div>
          <!-- Seller CTA -->
          <div class="card p-3" v-if="!auth.isSeller" style="border:1px dashed rgba(201,169,110,.3);">
            <div class="text-center">
              <i class="bi bi-shop text-gold" style="font-size:1.8rem;"></i>
              <p class="text-cream fw-600 mt-2 mb-1" style="font-size:.9rem;">Start Selling</p>
              <p class="text-muted mb-3" style="font-size:.78rem;">List your items and earn on Tasleem</p>
              <RouterLink to="/seller" class="btn btn-gold btn-sm w-100">
                <i class="bi bi-arrow-right-circle me-1"></i>Become a Seller
              </RouterLink>
            </div>
          </div>
          <!-- Seller dashboard shortcut -->
          <div class="card p-3" v-if="auth.isSeller" style="background:rgba(201,169,110,.05);border:1px solid rgba(201,169,110,.2);">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi bi-shop text-gold"></i>
              <span class="text-cream fw-600" style="font-size:.88rem;">Seller Account</span>
            </div>
            <RouterLink to="/seller" class="btn btn-outline-gold btn-sm w-100 mb-1">
              <i class="bi bi-grid me-1"></i>Dashboard
            </RouterLink>
            <RouterLink to="/seller/products/new" class="btn btn-gold btn-sm w-100">
              <i class="bi bi-plus me-1"></i>New Listing
            </RouterLink>
          </div>

          <!-- Wallet + workspaces -->
          <div class="card p-3 mt-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-muted" style="font-size:.8rem;">Wallet balance</span>
              <span class="text-gold fw-700">EGP {{ Number(auth.user?.wallet_balance || 0).toLocaleString() }}</span>
            </div>
            <RouterLink to="/wallet" class="btn btn-outline-gold btn-sm w-100 mb-1"><i class="bi bi-wallet2 me-1"></i>My Wallet</RouterLink>
            <RouterLink to="/offers" class="btn btn-outline-gold btn-sm w-100 mb-1"><i class="bi bi-tag me-1"></i>Offers</RouterLink>
            <RouterLink to="/seller/sales" class="btn btn-outline-gold btn-sm w-100"><i class="bi bi-graph-up-arrow me-1"></i>My Sales</RouterLink>
          </div>
        </div>

        <!-- Content -->
        <div class="col-lg-9">

          <!-- First-2-sales-free promo -->
          <div v-if="(auth.user?.free_sales_remaining || 0) > 0" class="alert py-2 px-3 mb-3 d-flex align-items-center gap-2"
            style="background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.3);font-size:.85rem;color:var(--gold);">
            <i class="bi bi-stars"></i>
            <span>Your first 2 sales are fee-free — <strong>{{ auth.user.free_sales_remaining }} left</strong></span>
          </div>

          <!-- ── Profile info ───────────────────────────────────── -->
          <div v-if="activeTab === 'profile'" class="card p-4">
            <h5 class="text-cream mb-4"><i class="bi bi-person me-2 text-gold"></i>Personal Information</h5>

            <!-- Read-only account summary -->
            <div class="row g-2 mb-4">
              <div class="col-md-4">
                <div style="background:var(--navy-light);border-radius:.7rem;padding:.7rem .9rem;">
                  <div class="text-muted" style="font-size:.72rem;">National ID <i class="bi bi-lock-fill"></i></div>
                  <div class="text-cream fw-600" style="font-size:.9rem;">{{ auth.user?.national_id || '—' }}</div>
                </div>
              </div>
              <div class="col-md-4">
                <div style="background:var(--navy-light);border-radius:.7rem;padding:.7rem .9rem;">
                  <div class="text-muted" style="font-size:.72rem;">Wallet balance</div>
                  <div class="text-gold fw-700" style="font-size:.9rem;">EGP {{ Number(auth.user?.wallet_balance || 0).toLocaleString() }}</div>
                </div>
              </div>
              <div class="col-md-4">
                <div style="background:var(--navy-light);border-radius:.7rem;padding:.7rem .9rem;">
                  <div class="text-muted" style="font-size:.72rem;">Member since</div>
                  <div class="text-cream fw-600" style="font-size:.9rem;">{{ formatDate(auth.user?.created_at) || '—' }}</div>
                </div>
              </div>
            </div>

            <div class="alert py-2 px-3 mb-3" style="background:rgba(46,204,113,.1);border:1px solid rgba(46,204,113,.25);font-size:.88rem;" v-if="profileSuccess">
              <i class="bi bi-check-circle me-2"></i>Profile updated successfully!
            </div>

            <form @submit.prevent="saveProfile" novalidate>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Full Name</label>
                  <input class="form-control" v-model="profileForm.name" placeholder="Your full name" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email <i class="bi bi-lock-fill text-muted" style="font-size:.72rem;"></i></label>
                  <input class="form-control" type="email" :value="auth.user?.email" disabled readonly
                    title="Your email cannot be changed" style="opacity:.7;cursor:not-allowed;" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone</label>
                  <input class="form-control" type="tel" v-model="profileForm.phone" placeholder="01xxxxxxxxx" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">City</label>
                  <input class="form-control" v-model="profileForm.city" placeholder="Cairo" />
                </div>
                <div class="col-12">
                  <label class="form-label">Address</label>
                  <textarea class="form-control" v-model="profileForm.address" rows="2" placeholder="Street, district..."></textarea>
                </div>
              </div>

              <hr class="divider-gold my-4" />
              <h6 class="text-cream mb-3">Change Password</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">New Password</label>
                  <input class="form-control" type="password" v-model="profileForm.password" placeholder="Leave blank to keep current" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Confirm Password</label>
                  <input class="form-control" type="password" v-model="profileForm.password_confirmation" placeholder="Repeat new password" />
                </div>
              </div>

              <div class="d-flex gap-2 mt-4">
                <button class="btn btn-gold px-4" type="submit" :disabled="auth.loading">
                  <span class="spinner-border spinner-border-sm me-2" v-if="auth.loading"></span>
                  <i class="bi bi-check2 me-2" v-else></i>
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <!-- ── Orders ──────────────────────────────────────────── -->
          <div v-if="activeTab === 'orders'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-cream mb-0"><i class="bi bi-bag me-2 text-gold"></i>My Orders</h5>
              <RouterLink class="btn btn-outline-gold btn-sm" to="/orders">View All</RouterLink>
            </div>
            <LoadingSpinner v-if="ordersLoading" height="200px" />
            <div v-else-if="orders.length === 0" class="card p-5 text-center">
              <i class="bi bi-bag-x text-muted" style="font-size:3rem;"></i>
              <p class="text-muted mt-3 mb-3">No orders yet</p>
              <RouterLink class="btn btn-gold btn-sm" to="/products">Start Shopping</RouterLink>
            </div>
            <div class="d-flex flex-column gap-3" v-else>
              <div
                class="card p-3 card-hover"
                v-for="order in orders"
                :key="order.order_id || order.id"
                @click="$router.push({ name: 'OrderDetail', params: { id: order.order_id || order.id } })"
                style="cursor:pointer;"
              >
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <div class="text-cream fw-600">#{{ order.order_id || order.id }} · {{ order.product?.name || 'Order' }}</div>
                    <div class="text-muted" style="font-size:.82rem;">{{ formatDate(order.created_at) }}</div>
                  </div>
                  <div class="text-end">
                    <div class="text-gold fw-700">{{ formatPrice(order.total_price ?? order.total) }}</div>
                    <span class="badge" :class="statusBadge(order.status)">{{ order.status }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Offers ──────────────────────────────────────────── -->
          <div v-if="activeTab === 'offers'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-cream mb-0"><i class="bi bi-tag me-2 text-gold"></i>My Offers</h5>
              <RouterLink class="btn btn-outline-gold btn-sm" to="/offers">View All</RouterLink>
            </div>
            <div class="card p-5 text-center">
              <i class="bi bi-tag text-gold" style="font-size:2.5rem;"></i>
              <p class="text-muted mt-3 mb-3">Offers you've made and offers received on your listings.</p>
              <RouterLink class="btn btn-gold btn-sm" to="/offers">Open Offers</RouterLink>
            </div>
          </div>

          <!-- ── Rentals ─────────────────────────────────────────── -->
          <div v-if="activeTab === 'rentals'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-cream mb-0"><i class="bi bi-clock-history me-2 text-gold"></i>My Rentals</h5>
              <RouterLink class="btn btn-outline-gold btn-sm" to="/rentals">View All</RouterLink>
            </div>
            <LoadingSpinner v-if="rentalsLoading" height="200px" />
            <div v-else-if="rentals.length === 0" class="card p-5 text-center">
              <i class="bi bi-clock-history text-muted" style="font-size:3rem;"></i>
              <p class="text-muted mt-3 mb-3">No rentals yet</p>
              <RouterLink class="btn btn-gold btn-sm" to="/products?rentable=1">Browse Rentals</RouterLink>
            </div>
            <div class="d-flex flex-column gap-3" v-else>
              <div class="card p-3" v-for="rental in rentals" :key="rental.id">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <div class="text-cream fw-600">{{ rental.product?.name || 'Rental #' + rental.id }}</div>
                    <div class="text-muted" style="font-size:.82rem;">
                      <i class="bi bi-calendar me-1"></i>{{ rental.start_date }} → {{ rental.end_date }}
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="text-gold fw-700">{{ formatPrice(rental.total_price) }}</div>
                    <span class="badge" :class="statusBadge(rental.status)">{{ rental.status }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Payments ────────────────────────────────────────── -->
          <div v-if="activeTab === 'payments'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-cream mb-0"><i class="bi bi-credit-card me-2 text-gold"></i>Payment History</h5>
              <RouterLink class="btn btn-outline-gold btn-sm" to="/payments">View All</RouterLink>
            </div>
            <LoadingSpinner v-if="paymentsLoading" height="200px" />
            <div v-else-if="payments.length === 0" class="card p-5 text-center">
              <i class="bi bi-credit-card text-muted" style="font-size:3rem;"></i>
              <p class="text-muted mt-3">No payments yet</p>
            </div>
            <div class="d-flex flex-column gap-3" v-else>
              <div class="card p-3" v-for="payment in payments" :key="payment.id">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <div class="text-cream fw-600">Payment #{{ payment.id }}</div>
                    <div class="text-muted" style="font-size:.8rem;">
                      <i class="bi bi-calendar me-1"></i>{{ formatDate(payment.created_at) }}
                      <span class="ms-2"><i class="bi bi-credit-card me-1"></i>{{ payment.method || 'Cash' }}</span>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="text-gold fw-700">{{ formatPrice(payment.amount) }}</div>
                    <span class="badge" :class="payment.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'">{{ payment.status }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Wishlist ────────────────────────────────────────── -->
          <div v-if="activeTab === 'wishlist'">
            <h5 class="text-cream mb-3"><i class="bi bi-heart me-2 text-gold"></i>My Wishlist</h5>
            <LoadingSpinner v-if="wishlistLoading" height="200px" />
            <div v-else-if="wishlist.items.length === 0" class="card p-5 text-center">
              <i class="bi bi-heart text-muted" style="font-size:3rem;"></i>
              <p class="text-muted mt-3">Your wishlist is empty</p>
            </div>
            <div class="row g-3" v-else>
              <div class="col-md-6" v-for="item in wishlist.items" :key="item.id">
                <ProductCard :product="item.product || item" />
              </div>
            </div>
          </div>

          <!-- ── Notifications ───────────────────────────────────── -->
          <div v-if="activeTab === 'notifications'">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h5 class="text-cream mb-0"><i class="bi bi-bell me-2 text-gold"></i>Notifications</h5>
              <button class="btn btn-outline-gold btn-sm" @click="notificationStore.markAllRead()" v-if="notificationStore.hasUnread">
                Mark all read
              </button>
            </div>
            <LoadingSpinner v-if="notificationStore.loading" height="200px" />
            <div v-else-if="notificationStore.items.length === 0" class="card p-5 text-center">
              <i class="bi bi-bell-slash text-muted" style="font-size:3rem;"></i>
              <p class="text-muted mt-3">No notifications</p>
            </div>
            <div class="d-flex flex-column gap-2" v-else>
              <div
                class="card p-3"
                :class="{ 'border-gold-subtle': !n.read_at }"
                v-for="n in notificationStore.items"
                :key="n.id"
                @click="notificationStore.markRead(n.id)"
                style="cursor:pointer;transition:var(--transition);"
              >
                <div class="d-flex align-items-start gap-3">
                  <div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width:40px;height:40px;border-radius:50%;background:rgba(201,169,110,.1);">
                    <i class="bi bi-bell text-gold"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-cream fw-500" style="font-size:.88rem;">{{ n.data?.title || n.title || 'Notification' }}</div>
                    <div class="text-muted" style="font-size:.8rem;">{{ n.data?.message || n.message }}</div>
                    <div class="text-muted mt-1" style="font-size:.73rem;">{{ formatDate(n.created_at) }}</div>
                  </div>
                  <div v-if="!n.read_at" style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:6px;"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWishlistStore } from '@/stores/wishlist'
import { useNotificationStore } from '@/stores/notifications'
import { userService, paymentService } from '@/services/api'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ProductCard from '@/components/ui/ProductCard.vue'
import TrustBadge from '@/components/ui/TrustBadge.vue'

const router = useRouter()
const auth = useAuthStore()
const wishlist = useWishlistStore()
const notificationStore = useNotificationStore()
const toast = useToast()

const activeTab = ref('profile')
const profileSuccess = ref(false)
const orders = ref([])
const rentals = ref([])
const payments = ref([])
const ordersLoading = ref(false)
const rentalsLoading = ref(false)
const paymentsLoading = ref(false)
const wishlistLoading = ref(false)

const tabs = [
  { key: 'profile',       label: 'Profile',       icon: 'bi bi-person' },
  { key: 'orders',        label: 'Orders',        icon: 'bi bi-bag' },
  { key: 'offers',        label: 'Offers',        icon: 'bi bi-tag' },
  { key: 'rentals',       label: 'Rentals',       icon: 'bi bi-clock-history' },
  { key: 'wishlist',      label: 'Wishlist',      icon: 'bi bi-heart' },
  { key: 'notifications', label: 'Notifications', icon: 'bi bi-bell' },
]

const initials = computed(() =>
  (auth.fullName || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
)

const profileForm = reactive({
  name: auth.user?.name || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || '',
  city: auth.user?.city || '',
  address: auth.user?.address || '',
  password: '',
  password_confirmation: ''
})

function formatPrice(v) { return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(v || 0) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-EG', { year:'numeric', month:'short', day:'numeric' }) : '' }
function statusBadge(s) {
  const m = { pending:'bg-warning text-dark', processing:'bg-info text-dark', completed:'bg-success', cancelled:'bg-danger', active:'bg-success', returned:'bg-secondary', overdue:'bg-danger', paid:'bg-success' }
  return m[s] || 'bg-secondary'
}

async function saveProfile() {
  // Email is locked — never sent in the update.
  const payload = {
    name: profileForm.name,
    phone: profileForm.phone,
    city: profileForm.city,
    address: profileForm.address,
  }
  if (profileForm.password) {
    payload.password = profileForm.password
    payload.password_confirmation = profileForm.password_confirmation
  }
  const res = await auth.updateProfile(payload)
  if (res.success) {
    profileSuccess.value = true
    profileForm.password = ''
    profileForm.password_confirmation = ''
    setTimeout(() => profileSuccess.value = false, 3000)
  } else {
    toast.error(res.message)
  }
}

watch(activeTab, async tab => {
  if (tab === 'orders' && orders.value.length === 0) {
    ordersLoading.value = true
    try { const r = await userService.getOrders(auth.user.id); orders.value = r.data?.data || r.data || [] } catch (_) {} finally { ordersLoading.value = false }
  }
  if (tab === 'rentals' && rentals.value.length === 0) {
    rentalsLoading.value = true
    try { const r = await userService.getRentals(auth.user.id); rentals.value = r.data?.data || r.data || [] } catch (_) {} finally { rentalsLoading.value = false }
  }
  if (tab === 'payments' && payments.value.length === 0) {
    paymentsLoading.value = true
    try { const r = await paymentService.getAll({ user_id: auth.user.id }); payments.value = r.data?.data || r.data || [] } catch (_) {} finally { paymentsLoading.value = false }
  }
  if (tab === 'wishlist') {
    wishlistLoading.value = true
    await wishlist.fetchWishlist()
    wishlistLoading.value = false
  }
  if (tab === 'notifications') {
    await notificationStore.fetchAll()
  }
})
</script>

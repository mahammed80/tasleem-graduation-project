<template>
  <div>
    <div class="page-header">
      <div class="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item"><RouterLink to="/">Home</RouterLink></li>
            <li class="breadcrumb-item"><RouterLink to="/orders">Orders</RouterLink></li>
            <li class="breadcrumb-item active">#{{ oid }}</li>
          </ol>
        </nav>
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <h1 class="text-cream mb-0">Order #{{ oid }}</h1>
          <span v-if="order" class="badge fs-6 px-3 py-2" :class="statusBadge(order.status)">{{ statusLabel(order.status) }}</span>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <LoadingSpinner v-if="loading" height="300px" />

      <div class="row g-4" v-else-if="order">
        <div class="col-lg-8">
          <!-- Item -->
          <div class="card p-4 mb-4">
            <h6 class="text-cream mb-3">Item</h6>
            <div class="d-flex align-items-center gap-3">
              <RouterLink :to="`/products/${order.product?.id}`">
                <div class="rounded-xl overflow-hidden flex-shrink-0" style="width:84px;height:84px;background:var(--navy-light);">
                  <img v-if="img" :src="img" style="width:100%;height:100%;object-fit:cover;" />
                  <div v-else class="d-flex align-items-center justify-content-center h-100"><i class="bi bi-image text-muted"></i></div>
                </div>
              </RouterLink>
              <div class="flex-grow-1">
                <RouterLink :to="`/products/${order.product?.id}`" class="text-cream text-decoration-none fw-600">{{ order.product?.name || 'Product' }}</RouterLink>
                <div class="text-muted" style="font-size:.84rem;">Qty {{ order.quantity }} × {{ formatPrice(order.unit_price) }}</div>
                <span class="badge mt-1" :class="isTasleem ? 'badge-gold' : 'bg-info text-dark'">{{ isTasleem ? 'Tasleem store' : 'Marketplace' }}</span>
              </div>
            </div>
          </div>

          <!-- Admin: parties -->
          <div class="card p-4 mb-4" v-if="auth.isAdmin">
            <h6 class="text-cream mb-3">Buyer &amp; Seller</h6>
            <div class="row-line"><span>Buyer</span><b>{{ order.user?.name || ('User #' + (order.user?.id || '')) }}</b></div>
            <div class="row-line" v-if="order.user?.phone"><span>Buyer phone</span><b>{{ order.user.phone }}</b></div>
            <div class="row-line" v-if="address"><span>Deliver to</span><b class="text-end">{{ address }}</b></div>
            <hr class="divider-gold my-2" />
            <div class="row-line"><span>Seller</span><b>{{ isTasleem ? 'Tasleem store' : (order.product?.owner?.name || 'Seller') }}</b></div>
          </div>

          <!-- Timeline -->
          <div class="card p-4">
            <h6 class="text-cream mb-3">Status</h6>
            <div v-if="cancelled" class="alert-cancel"><i class="bi bi-x-circle me-2"></i>Order cancelled &amp; refunded.</div>
            <div v-else class="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <template v-for="(step, i) in steps" :key="step">
                <div class="d-flex flex-column align-items-center gap-1" style="flex:1;">
                  <div class="timeline-dot" :class="{ active: stepIndex >= i, current: stepIndex === i }">
                    <i class="bi" :class="stepIndex > i ? 'bi-check2' : 'bi-circle-fill'" style="font-size:.7rem;"></i>
                  </div>
                  <span style="font-size:.72rem;color:var(--text-muted);">{{ step }}</span>
                </div>
                <div v-if="i < steps.length - 1" class="flex-grow-1" style="height:2px;background:var(--navy-border);" :style="stepIndex > i ? 'background:var(--gold);' : ''"></div>
              </template>
            </div>
          </div>
        </div>

        <!-- Summary & actions -->
        <div class="col-lg-4">
          <!-- Seller earnings -->
          <div class="card p-4 mb-3" v-if="isSeller && !isBuyer">
            <h6 class="text-cream mb-3">Your earnings</h6>
            <div class="row-line"><span>Item price</span><b>{{ formatPrice(order.total_price) }}</b></div>
            <div class="row-line"><span>Tasleem fee</span><b>{{ isTasleem ? 'No platform fee' : (Number(order.tasleem_fee) === 0 ? 'Free 🎉' : '- ' + formatPrice(order.tasleem_fee)) }}</b></div>
            <hr class="divider-gold my-2" />
            <div class="row-line"><span class="fw-700 text-cream">{{ completed ? 'Paid to you' : 'You will receive' }}</span><b class="text-gold fs-5">{{ formatPrice(payout) }}</b></div>
          </div>

          <!-- Buyer/admin payment -->
          <div class="card p-4 mb-3" v-else>
            <h6 class="text-cream mb-3">Payment</h6>
            <div class="row-line"><span>Item total</span><b>{{ formatPrice(order.unit_price * order.quantity) }}</b></div>
            <div class="row-line" v-if="Number(order.delivery_fee) > 0"><span>Delivery</span><b>{{ formatPrice(order.delivery_fee) }}</b></div>
            <div class="row-line"><span>Method</span><b>{{ order.payment_method === 'cash' ? 'Cash on Delivery' : 'Wallet' }}</b></div>
            <div class="row-line" v-if="protection"><span>Protection</span><b>{{ protection }}</b></div>
            <hr class="divider-gold my-2" />
            <div class="row-line"><span class="fw-700 text-cream">Total</span><b class="text-gold fs-5">{{ formatPrice(Number(order.total_price) + Number(order.delivery_fee || 0)) }}</b></div>
          </div>

          <!-- Actions -->
          <div class="card p-4">
            <h6 class="text-cream mb-3">Actions</h6>

            <div v-if="completed" class="alert-ok"><i class="bi bi-check-circle me-2"></i>Order completed — seller has been paid.</div>

            <button v-if="isSeller && order.status === 'pending'" class="btn btn-gold w-100 mb-2" @click="run('sellerConfirm', 'Order confirmed')" :disabled="busy">
              <span class="spinner-border spinner-border-sm me-2" v-if="busy"></span>Confirm order
            </button>

            <button v-if="auth.isAdmin && order.status === 'confirmed'" class="btn w-100 mb-2" style="background:#2ecc71;color:#04130b;border:none;" @click="run('complete', 'Completed — seller paid')" :disabled="busy">
              <span class="spinner-border spinner-border-sm me-2" v-if="busy"></span>Mark Completed · pay seller
            </button>

            <button v-if="(isBuyer && canCancel) || (auth.isAdmin && adminCanCancel)" class="btn w-100 mb-2" style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);color:#e74c3c;" @click="run('cancel', 'Order cancelled & refunded')" :disabled="busy">
              <i class="bi bi-x-circle me-2"></i>Cancel order
            </button>

            <div v-if="!completed && isBuyer && order.status === 'pending'" class="note"><i class="bi bi-hourglass-split me-1"></i>Waiting for the seller to confirm… <span class="text-muted">(you can still cancel now)</span></div>
            <div v-if="!completed && isBuyer && order.status === 'confirmed'" class="note"><i class="bi bi-truck me-1"></i>Confirmed — your order will be delivered within <strong>3–5 business days</strong>. Cancellation is no longer available.</div>
            <div v-if="!completed && isBuyer && order.status === 'shipped'" class="note"><i class="bi bi-truck me-1"></i>On the way — estimated delivery within <strong>3–5 business days</strong>.</div>

            <RouterLink class="btn btn-outline-gold w-100 btn-sm mt-1" to="/orders"><i class="bi bi-arrow-left me-2"></i>Back to Orders</RouterLink>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-5">
        <i class="bi bi-bag-x text-muted" style="font-size:3rem;"></i>
        <p class="text-muted mt-2">Order not found</p>
        <RouterLink class="btn btn-outline-gold" to="/orders">Back to Orders</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { orderService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import {
  unwrap, orderId, productImage, isTasleemOrder,
  orderStatusLabel as statusLabel, orderStatusBadge as statusBadge,
  orderStepIndex, isOrderCancelled, isOrderCompleted, formatPrice,
} from '@/utils/helpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const route = useRoute()
const toast = useToast()
const auth = useAuthStore()
const order = ref(null)
const loading = ref(true)
const busy = ref(false)

const steps = ['Placed', 'Confirmed', 'Completed']
const oid = computed(() => orderId(order.value) || route.params.id)
const img = computed(() => productImage(order.value?.product))
const isTasleem = computed(() => isTasleemOrder(order.value))
const me = computed(() => auth.user?.id)
const isBuyer = computed(() => (order.value?.user?.id ?? order.value?.user_id) === me.value)
const isSeller = computed(() => order.value?.product?.owner?.id === me.value)
const cancelled = computed(() => isOrderCancelled(order.value?.status))
const completed = computed(() => isOrderCompleted(order.value?.status))
// Buyers can only cancel while still 'pending' (awaiting seller). Once confirmed it's
// in progress and can't be cancelled. Admin keeps the ability to cancel/refund either way.
const canCancel = computed(() => order.value?.status === 'pending')
const adminCanCancel = computed(() => ['pending', 'confirmed'].includes(order.value?.status))
const stepIndex = computed(() => orderStepIndex(order.value?.status))
// Tasleem (store) orders never carry a platform fee — Tasleem is the platform.
const payout = computed(() => Number(order.value?.total_price || 0) - (isTasleem.value ? 0 : Number(order.value?.tasleem_fee || 0)))
const address = computed(() => [order.value?.user?.address, order.value?.user?.city].filter(Boolean).join(', '))
const protection = computed(() => {
  const o = order.value
  if (!o || o.payment_method === 'cash' || isTasleem.value) return ''
  const s = o.payment?.status
  if (s === 'completed') return 'Released to seller'
  if (s === 'refunded') return 'Refunded'
  if (s === 'pending') return 'Held by Tasleem'
  return ''
})

async function load() {
  try {
    const res = await orderService.getById(route.params.id)
    order.value = unwrap(res)
  } catch (_) { order.value = null } finally { loading.value = false }
}

async function run(action, okMsg) {
  busy.value = true
  try {
    await orderService[action](oid.value)
    toast.success(okMsg)
    await load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Action failed')
  } finally { busy.value = false }
}

onMounted(load)
</script>

<style scoped>
.timeline-dot { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: var(--navy-light); border: 2px solid var(--navy-border); color: var(--text-muted); }
.timeline-dot.active  { border-color: var(--gold); color: var(--gold); background: rgba(201,169,110,.1); }
.timeline-dot.current { background: var(--gold); color: var(--navy); border-color: var(--gold); }
.row-line { display:flex; justify-content:space-between; gap:.75rem; margin-bottom:.5rem; font-size:.9rem; color:var(--text-muted); }
.row-line b { color:var(--text-main); font-weight:600; }
.alert-cancel { background:rgba(231,76,60,.08); border:1px solid rgba(231,76,60,.2); border-radius:.6rem; padding:.6rem .8rem; color:#e74c3c; font-size:.85rem; }
.alert-ok { background:rgba(46,204,113,.1); border-radius:.6rem; padding:.7rem .8rem; color:#2ecc71; font-size:.85rem; margin-bottom:.6rem; }
.note { background:rgba(201,169,110,.08); border-radius:.6rem; padding:.6rem .8rem; color:var(--gold); font-size:.8rem; margin-bottom:.5rem; }
</style>

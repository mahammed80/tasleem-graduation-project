<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-bag-check me-2 text-gold"></i>My Orders</h1>
      </div>
    </div>
    <div class="container py-4">
      <LoadingSpinner v-if="loading" height="300px" text="Loading orders..." />

      <div v-else-if="orders.length === 0" class="text-center py-5">
        <i class="bi bi-bag-x text-muted" style="font-size:3rem;"></i>
        <h5 class="text-muted mt-3">No orders yet</h5>
        <RouterLink class="btn btn-gold mt-2" to="/products">Start Shopping</RouterLink>
      </div>

      <div class="d-flex flex-column gap-3" v-else>
        <template v-for="(g, gi) in groupedOrders" :key="gi">
          <!-- Single (C2C / user) order -->
          <div v-if="g.type === 'single'" class="card p-4">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-xl overflow-hidden flex-shrink-0" style="width:60px;height:60px;background:var(--navy-light);">
                  <img v-if="img(g.order)" :src="img(g.order)" style="width:100%;height:100%;object-fit:cover;" />
                  <div v-else class="d-flex align-items-center justify-content-center h-100"><i class="bi bi-image text-muted"></i></div>
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="text-gold fw-700">Order #{{ oid(g.order) }}</span>
                    <span class="badge bg-info text-dark" style="font-size:.6rem;">Marketplace</span>
                    <span class="badge" :class="statusBadge(g.order.status)">{{ statusLabel(g.order.status) }}</span>
                  </div>
                  <div class="text-cream" style="font-size:.9rem;">{{ g.order.product?.name || 'Product' }}</div>
                  <div class="text-muted" style="font-size:.8rem;"><i class="bi bi-calendar me-1"></i>{{ formatDate(g.order.created_at) }} · Qty {{ g.order.quantity }}</div>
                </div>
              </div>
              <div class="text-end">
                <div class="text-gold fw-700 fs-5 mb-2">{{ formatPrice(g.order.total_price) }}</div>
                <div class="d-flex gap-2 justify-content-end">
                  <RouterLink class="btn btn-sm btn-outline-gold" :to="`/orders/${oid(g.order)}`"><i class="bi bi-eye me-1"></i>View</RouterLink>
                  <button v-if="canCancel(g.order.status)" class="btn btn-sm btn-outline-danger" @click="cancelOrder(g.order)" :disabled="cancellingId === oid(g.order)">
                    <span class="spinner-border spinner-border-sm me-1" v-if="cancellingId === oid(g.order)"></span>
                    <i class="bi bi-x-circle me-1" v-else></i>Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tasleem store bundle (all Tasleem items from one checkout, as one card) -->
          <div v-else class="card p-4">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div class="d-flex align-items-center gap-2">
                <span class="badge badge-gold"><i class="bi bi-shop me-1"></i>Tasleem Order</span>
                <span class="text-muted" style="font-size:.8rem;">{{ g.orders.length }} items · {{ formatDate(g.orders[0].created_at) }}</span>
              </div>
              <span class="badge" :class="statusBadge(bundleStatus(g))">{{ bundleStatus(g) === 'mixed' ? 'Mixed' : statusLabel(bundleStatus(g)) }}</span>
            </div>
            <div class="d-flex flex-column gap-2">
              <RouterLink v-for="o in g.orders" :key="oid(o)" :to="`/orders/${oid(o)}`" class="d-flex align-items-center gap-2 text-decoration-none bundle-row">
                <div class="rounded overflow-hidden flex-shrink-0" style="width:44px;height:44px;background:var(--navy-light);">
                  <img v-if="img(o)" :src="img(o)" style="width:100%;height:100%;object-fit:cover;" />
                  <div v-else class="d-flex align-items-center justify-content-center h-100"><i class="bi bi-image text-muted" style="font-size:.8rem;"></i></div>
                </div>
                <div class="flex-grow-1 min-w-0">
                  <div class="text-cream text-truncate" style="font-size:.85rem;">{{ o.product?.name || 'Product' }}</div>
                  <div class="text-muted" style="font-size:.74rem;">#{{ oid(o) }} · Qty {{ o.quantity }} · <span :class="'text-' + (o.status==='delivered'?'success':'muted')">{{ statusLabel(o.status) }}</span></div>
                </div>
                <div class="text-gold fw-600" style="font-size:.85rem;">{{ formatPrice(o.total_price) }}</div>
              </RouterLink>
            </div>
            <hr class="divider-gold my-2" />
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-cream fw-700">Total ({{ g.orders.length }} orders)</span>
              <span class="text-gold fw-700 fs-6">{{ formatPrice(bundleTotal(g)) }}</span>
            </div>
            <button v-if="bundleCancellable(g)" class="btn btn-sm btn-outline-danger mt-2" @click="cancelBundle(g)" :disabled="bundleBusy === g.key">
              <span class="spinner-border spinner-border-sm me-1" v-if="bundleBusy === g.key"></span>
              <i class="bi bi-x-circle me-1" v-else></i>Cancel all
            </button>
          </div>
        </template>
      </div>

      <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchOrders" />
    </div>

    <div class="modal fade" id="cancelModal" tabindex="-1" ref="cancelModal">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0 pb-1">
            <h6 class="modal-title text-cream"><i class="bi bi-x-circle text-danger me-2"></i>Cancel Order?</h6>
          </div>
          <div class="modal-body text-muted" style="font-size:.88rem;">
            This will cancel order <strong class="text-cream">#{{ oid(toCancel) }}</strong> and refund any held funds.
          </div>
          <div class="modal-footer border-0 pt-1 gap-2">
            <button class="btn btn-sm btn-outline-gold" data-bs-dismiss="modal">Keep Order</button>
            <button class="btn btn-sm btn-danger" @click="confirmCancel">Yes, Cancel It</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { orderService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { Modal } from 'bootstrap'
import {
  unwrapList, pagination, orderId as oid, productImage, isTasleemOrder,
  orderStatusLabel as statusLabel, orderStatusBadge as statusBadge, formatPrice, formatDate,
} from '@/utils/helpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const auth = useAuthStore()
const toast = useToast()
const orders = ref([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)
const cancellingId = ref(null)
const bundleBusy = ref(null)
const toCancel = ref(null)
const cancelModal = ref(null)
let bsModal = null

const img = o => productImage(o?.product)
// You can only cancel while the order is still 'pending' (awaiting the seller).
// Once confirmed it's in progress and can't be cancelled.
const canCancel = s => s === 'pending'

// Group orders for display: all Tasleem (store) orders from the SAME checkout
// become one bundle card; each user (C2C) order stays its own card.
const groupedOrders = computed(() => {
  const out = []
  const buckets = {}
  for (const o of orders.value) {
    if (isTasleemOrder(o)) {
      const key = 'tas|' + (o.created_at || '').slice(0, 16) // same minute = same checkout
      if (!buckets[key]) { buckets[key] = { type: 'bundle', key, orders: [] }; out.push(buckets[key]) }
      buckets[key].orders.push(o)
    } else {
      out.push({ type: 'single', order: o })
    }
  }
  // A lone Tasleem order isn't really a bundle — show it as a single card.
  return out.map(g => (g.type === 'bundle' && g.orders.length === 1) ? { type: 'single', order: g.orders[0] } : g)
})
const bundleTotal = g => g.orders.reduce((s, o) => s + Number(o.total_price || 0), 0)
const bundleStatus = g => { const set = new Set(g.orders.map(o => o.status)); return set.size === 1 ? [...set][0] : 'mixed' }
const bundleCancellable = g => g.orders.every(o => o.status === 'pending')

async function cancelBundle(g) {
  bundleBusy.value = g.key
  try {
    for (const o of g.orders) {
      if (o.status === 'pending') { await orderService.cancel(oid(o)); o.status = 'cancelled' }
    }
    toast.success('Tasleem order cancelled & refunded')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to cancel some items')
  } finally { bundleBusy.value = null }
}

function cancelOrder(order) {
  toCancel.value = order
  bsModal = bsModal || new Modal(cancelModal.value)
  bsModal.show()
}

async function confirmCancel() {
  if (!toCancel.value) return
  cancellingId.value = oid(toCancel.value)
  bsModal.hide()
  try {
    await orderService.cancel(oid(toCancel.value)) // POST /orders/{id}/cancel → refund + relist
    const found = orders.value.find(o => oid(o) === oid(toCancel.value))
    if (found) found.status = 'cancelled'
    toast.success(`Order #${oid(toCancel.value)} cancelled & refunded`)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to cancel order')
  } finally {
    cancellingId.value = null
    toCancel.value = null
  }
}

async function fetchOrders(page = 1) {
  loading.value = true
  try {
    const res = await orderService.getAll({ user_id: auth.user?.id, page, per_page: 10 })
    orders.value = unwrapList(res)
    totalPages.value = pagination(res).last_page || 1
    currentPage.value = page
  } catch (_) { orders.value = [] } finally { loading.value = false }
}

onMounted(() => fetchOrders())
</script>

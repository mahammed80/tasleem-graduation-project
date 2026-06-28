<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-graph-up-arrow text-gold me-2"></i>My Sales</h1>
        <p class="text-muted mb-0 mt-1" style="font-size:.9rem;">Orders placed on your listings.</p>
      </div>
    </div>

    <div class="container py-4">
      <LoadingSpinner v-if="loading" height="220px" />

      <div v-else-if="orders.length === 0" class="empty">
        <i class="bi bi-receipt"></i>
        <p>No orders on your items yet.</p>
        <RouterLink to="/seller/products/new" class="btn btn-outline-gold btn-sm">List a product</RouterLink>
      </div>

      <div v-else class="d-flex flex-column gap-3">
        <RouterLink v-for="o in orders" :key="orderId(o)" :to="`/orders/${orderId(o)}`" class="card p-3 text-decoration-none sale-card">
          <div class="d-flex align-items-center gap-3">
            <img v-if="img(o)" :src="img(o)" class="thumb" />
            <div v-else class="thumb d-flex align-items-center justify-content-center"><i class="bi bi-image text-muted"></i></div>
            <div class="flex-grow-1 min-w-0">
              <div class="text-cream fw-600 text-truncate">{{ o.product?.name || ('Order #' + orderId(o)) }}</div>
              <div class="text-muted" style="font-size:.78rem;">
                {{ o.user?.name || ('Buyer #' + (o.user?.id || '')) }} · Qty {{ o.quantity }}
                <span v-if="o.payment_method"> · {{ o.payment_method === 'cash' ? 'COD' : 'Wallet' }}</span>
              </div>
              <div class="text-gold fw-700" style="font-size:.9rem;">
                {{ completed(o) ? 'Earned' : 'You get' }}: {{ formatPrice(Number(o.total_price) - Number(o.tasleem_fee || 0)) }}
              </div>
            </div>
            <span class="badge" :class="statusBadge(o.status)">{{ statusLabel(o.status) }}</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { orderService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import {
  unwrapList, orderId, productImage,
  orderStatusLabel as statusLabel, orderStatusBadge as statusBadge,
  isOrderCompleted, formatPrice,
} from '@/utils/helpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const auth = useAuthStore()
const orders = ref([])
const loading = ref(true)

const img = o => productImage(o.product)
const completed = o => isOrderCompleted(o.status)

onMounted(async () => {
  const me = auth.user?.id
  if (!me) { loading.value = false; return }
  try {
    const res = await orderService.getAll({ seller_id: me, per_page: 60 })
    // Server filter may be ignored — keep only orders on items I own.
    orders.value = unwrapList(res)
      .filter(o => o.product?.owner?.id === me)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (_) {
    orders.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.thumb { width:58px; height:58px; border-radius:.7rem; object-fit:cover; background:var(--navy-light); flex-shrink:0; }
.sale-card { transition: border-color .12s; }
.sale-card:hover { border-color: var(--gold) !important; }
.empty { text-align:center; padding:3rem 1rem; color:var(--text-muted); }
.empty i { font-size:2.4rem; display:block; margin-bottom:.6rem; }
</style>

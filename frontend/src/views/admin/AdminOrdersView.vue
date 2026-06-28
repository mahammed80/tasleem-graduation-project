<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-bag-check text-gold me-2"></i>Orders Management</h1>
      </div>
    </div>

    <div class="container py-4">
      <!-- Filters -->
      <div class="d-flex flex-wrap gap-2 mb-3">
        <button v-for="s in sources" :key="s.v" class="btn btn-sm" :class="source===s.v ? 'btn-gold' : 'btn-outline-gold'" @click="source=s.v">{{ s.l }}</button>
        <span class="vr mx-1"></span>
        <select class="form-select form-select-sm" v-model="status" @change="fetch" style="width:auto;">
          <option value="all">All statuses</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <LoadingSpinner v-if="loading" height="240px" />
      <div v-else class="card overflow-hidden">
        <div class="table-responsive">
          <table class="table mb-0 align-middle">
            <thead><tr><th style="width:70px;">Order</th><th>Product</th><th>Buyer</th><th>Total</th><th>Status</th><th style="width:170px;">Change</th></tr></thead>
            <tbody>
              <tr v-if="filtered.length===0"><td colspan="6" class="text-center text-muted py-4">No orders</td></tr>
              <tr v-for="o in filtered" :key="oid(o)">
                <td><RouterLink :to="`/orders/${oid(o)}`" class="text-gold fw-700 text-decoration-none">#{{ oid(o) }}</RouterLink></td>
                <td>
                  <RouterLink :to="`/orders/${oid(o)}`" class="d-flex align-items-center gap-2 text-decoration-none">
                    <div class="rounded overflow-hidden flex-shrink-0" style="width:38px;height:38px;background:var(--navy-light);">
                      <img v-if="img(o)" :src="img(o)" style="width:100%;height:100%;object-fit:cover;" />
                    </div>
                    <div>
                      <div class="text-cream" style="font-size:.84rem;">{{ o.product?.name || ('#'+oid(o)) }}</div>
                      <span class="badge" :class="isTasleem(o) ? 'badge-gold' : 'bg-info text-dark'" style="font-size:.6rem;">{{ isTasleem(o) ? 'Tasleem' : 'Seller' }}</span>
                    </div>
                  </RouterLink>
                </td>
                <td class="text-muted" style="font-size:.82rem;">{{ o.user?.name || '—' }} · Qty {{ o.quantity }}<br><span style="font-size:.72rem;">{{ o.payment_method === 'cash' ? 'COD' : 'Wallet' }}</span></td>
                <td class="text-gold fw-700" style="font-size:.85rem;">{{ formatPrice(o.total_price) }}</td>
                <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
                <td>
                  <select class="form-select form-select-sm" :value="o.status" @change="change(o, $event.target.value)" style="font-size:.74rem;">
                    <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { orderService } from '@/services/api'
import { useToast } from 'vue-toastification'
import {
  unwrapList, orderId as oid, productImage, isTasleemOrder as isTasleem,
  orderStatusBadge as statusBadge, formatPrice,
} from '@/utils/helpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const toast = useToast()
const orders = ref([])
const loading = ref(true)
const source = ref('all')
const status = ref('all')
const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned']
const sources = [{ v: 'all', l: 'All' }, { v: 'tasleem', l: 'Tasleem' }, { v: 'users', l: 'Users' }]

const img = o => productImage(o.product)
const filtered = computed(() => source.value === 'all' ? orders.value : orders.value.filter(o => (source.value === 'tasleem') === isTasleem(o)))

async function fetch() {
  loading.value = true
  try {
    const params = { per_page: 60, page: 1 }
    if (status.value !== 'all') params.status = status.value
    const res = await orderService.getAll(params) // backend now sorts newest-first
    orders.value = unwrapList(res).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (_) { orders.value = [] } finally { loading.value = false }
}

async function change(o, next) {
  if (next === o.status) return
  try {
    // delivered → complete (pay seller); cancelled/returned → cancel (refund); else generic.
    if (next === 'delivered') await orderService.complete(oid(o))
    else if (next === 'cancelled' || next === 'returned') await orderService.cancel(oid(o))
    else await orderService.update(oid(o), { status: next })
    o.status = next
    toast.success(`Order #${oid(o)} → ${next}`)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to update order')
  }
}

onMounted(fetch)
</script>

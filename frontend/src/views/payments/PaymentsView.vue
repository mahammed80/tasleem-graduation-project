<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-credit-card me-2 text-gold"></i>Payment History</h1>
      </div>
    </div>

    <div class="container py-4">
      <!-- Summary cards -->
      <div class="row g-3 mb-5">
        <div class="col-md-4">
          <div class="card p-4 text-center">
            <div class="text-muted mb-1" style="font-size:.78rem;text-transform:uppercase;letter-spacing:.07em;">Total Spent</div>
            <div class="text-gold fw-700" style="font-size:1.8rem;">{{ formatPrice(totalSpent) }}</div>
            <div class="text-muted" style="font-size:.78rem;">All time</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card p-4 text-center">
            <div class="text-muted mb-1" style="font-size:.78rem;text-transform:uppercase;letter-spacing:.07em;">Transactions</div>
            <div class="text-cream fw-700" style="font-size:1.8rem;">{{ payments.length }}</div>
            <div class="text-muted" style="font-size:.78rem;">Completed payments</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card p-4 text-center">
            <div class="text-muted mb-1" style="font-size:.78rem;text-transform:uppercase;letter-spacing:.07em;">Average</div>
            <div class="text-cream fw-700" style="font-size:1.8rem;">{{ formatPrice(avgPayment) }}</div>
            <div class="text-muted" style="font-size:.78rem;">Per transaction</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="d-flex gap-2 mb-4 flex-wrap align-items-center">
        <select v-model="methodFilter" class="form-select form-select-sm" style="width:auto;" @change="applyFilter">
          <option value="">All Methods</option>
          <option value="cash">Cash on Delivery</option>
          <option value="card">Credit Card</option>
          <option value="vodafone_cash">Vodafone Cash</option>
          <option value="instapay">InstaPay</option>
        </select>
        <select v-model="statusFilter" class="form-select form-select-sm" style="width:auto;" @change="applyFilter">
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card p-0 overflow-hidden">
        <LoadingSpinner v-if="loading" height="240px" />
        <div v-else-if="filtered.length === 0" class="text-center py-5">
          <i class="bi bi-credit-card text-muted" style="font-size:3rem;"></i>
          <p class="text-muted mt-3">No payments found</p>
        </div>
        <div class="table-responsive" v-else>
          <table class="table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Order</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in paginated" :key="p.id">
                <td class="text-muted" style="font-size:.82rem;">{{ p.id }}</td>
                <td>
                  <RouterLink v-if="p.order_id" :to="`/orders/${p.order_id}`" class="text-gold text-decoration-none">
                    <i class="bi bi-bag me-1"></i>Order #{{ p.order_id }}
                  </RouterLink>
                  <span class="text-muted" v-else>—</span>
                </td>
                <td class="text-cream fw-700">{{ formatPrice(p.amount) }}</td>
                <td>
                  <span class="d-flex align-items-center gap-1" style="font-size:.85rem;">
                    <i :class="methodIcon(p.method)" class="text-gold"></i>
                    {{ methodLabel(p.method) }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="statusBadge(p.status)">{{ p.status }}</span>
                </td>
                <td class="text-muted" style="font-size:.82rem;">{{ formatDate(p.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="p-3">
          <Pagination :current-page="currentPage" :total-pages="totalPages" @change="p => currentPage = p" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { paymentService } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const payments = ref([])
const loading = ref(true)
const methodFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const perPage = 15

const filtered = computed(() => {
  let list = payments.value
  if (methodFilter.value) list = list.filter(p => p.method === methodFilter.value)
  if (statusFilter.value) list = list.filter(p => p.status === statusFilter.value)
  return list
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const totalSpent = computed(() => payments.value.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0))
const avgPayment = computed(() => {
  const paid = payments.value.filter(p => p.status === 'paid')
  return paid.length ? totalSpent.value / paid.length : 0
})

function applyFilter() { currentPage.value = 1 }
function formatPrice(v) { return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(v || 0) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-EG', { year:'numeric', month:'short', day:'numeric' }) : '—' }
function statusBadge(s) {
  const m = { paid:'bg-success', pending:'bg-warning text-dark', failed:'bg-danger', refunded:'bg-info text-dark' }
  return m[s] || 'bg-secondary'
}
function methodIcon(m) {
  const icons = { cash: 'bi bi-cash', card: 'bi bi-credit-card-2-front', vodafone_cash: 'bi bi-phone', instapay: 'bi bi-bank' }
  return icons[m] || 'bi bi-currency-dollar'
}
function methodLabel(m) {
  const labels = { cash: 'Cash on Delivery', card: 'Credit Card', vodafone_cash: 'Vodafone Cash', instapay: 'InstaPay' }
  return labels[m] || m || '—'
}

onMounted(async () => {
  try {
    const res = await paymentService.getAll({ per_page: 500 })
    payments.value = res.data?.data || res.data || []
  } catch (_) {} finally { loading.value = false }
})
</script>

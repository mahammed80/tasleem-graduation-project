<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="text-cream mb-0">Orders Management</h5>
      <select class="form-select form-select-sm" v-model="statusFilter" @change="fetchOrders(1)" style="width:auto;">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <LoadingSpinner v-if="loading" height="200px" />
    <div v-else class="card overflow-hidden">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th style="width:130px;">Actions</th></tr>
          </thead>
          <tbody>
            <tr v-if="orders.length === 0"><td colspan="6" class="text-center text-muted py-4">No orders found</td></tr>
            <tr v-for="order in orders" :key="order.id">
              <td class="text-gold fw-600" style="font-size:.85rem;">#{{ order.id }}</td>
              <td class="text-muted" style="font-size:.82rem;">{{ order.user?.name || '—' }}</td>
              <td class="text-muted" style="font-size:.78rem;">{{ formatDate(order.created_at) }}</td>
              <td class="text-cream fw-600" style="font-size:.88rem;">{{ formatPrice(order.total) }}</td>
              <td>
                <select class="form-select form-select-sm" :value="order.status" @change="updateStatus(order, $event.target.value)" style="width:auto;font-size:.75rem;padding:.15rem .3rem;">
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td>
                <RouterLink class="btn btn-sm btn-outline-gold px-2 py-1" :to="`/orders/${order.id}`">
                  <i class="bi bi-eye" style="font-size:.75rem;"></i>
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchOrders" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { orderService } from '@/services/api'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const toast = useToast()
const orders = ref([])
const loading = ref(true)
const statusFilter = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

function formatPrice(v) { return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(v || 0) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' }) : '' }

async function fetchOrders(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const res = await orderService.getAll({ page, per_page: 15, status: statusFilter.value || undefined })
    orders.value = res.data?.data || res.data || []
    totalPages.value = res.data?.last_page || 1
  } catch (_) { orders.value = [] } finally { loading.value = false }
}

async function updateStatus(order, status) {
  try {
    await orderService.update(order.id, { status })
    order.status = status
    toast.success(`Order #${order.id} → ${status}`)
  } catch (e) { toast.error(e.response?.data?.message || 'Failed to update') }
}

onMounted(() => fetchOrders())
</script>

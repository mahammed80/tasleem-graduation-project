<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="text-cream mb-0">System Logs</h5>
      <div class="d-flex gap-2 flex-wrap">
        <select class="form-select form-select-sm" v-model="filters.action" @change="fetchLogs(1)" style="width:auto;">
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </select>
        <select class="form-select form-select-sm" v-model="filters.entity_type" @change="fetchLogs(1)" style="width:auto;">
          <option value="">All Entities</option>
          <option value="User">User</option>
          <option value="Product">Product</option>
          <option value="Order">Order</option>
          <option value="Rental">Rental</option>
          <option value="Payment">Payment</option>
        </select>
        <select class="form-select form-select-sm" v-model="filters.status" @change="fetchLogs(1)" style="width:auto;">
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
      </div>
    </div>

    <LoadingSpinner v-if="loading" height="200px" />
    <div v-else class="card overflow-hidden">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr><th>Action</th><th>Entity</th><th>User</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr v-if="logs.length === 0"><td colspan="5" class="text-center text-muted py-4">No logs found</td></tr>
            <tr v-for="log in logs" :key="log.id">
              <td>
                <span class="badge" :class="actionBadge(log.action)">{{ log.action }}</span>
              </td>
              <td class="text-muted" style="font-size:.8rem;">
                <span class="text-cream">{{ log.entity_type || '—' }}</span>
                <span v-if="log.entity_id"> #{{ log.entity_id }}</span>
              </td>
              <td class="text-muted" style="font-size:.78rem;">{{ log.user?.name || log.user_id || '—' }}</td>
              <td class="text-muted" style="font-size:.72rem;">{{ formatDate(log.created_at) }}</td>
              <td>
                <span class="badge" :class="log.status === 'error' ? 'bg-danger' : 'bg-success'" style="font-size:.65rem;">
                  {{ log.status || 'success' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchLogs" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { logService } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const logs = ref([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)
const filters = reactive({ action: '', entity_type: '', status: '' })

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
}
function actionBadge(a) {
  const m = { created: 'bg-success', updated: 'bg-info text-dark', deleted: 'bg-danger', login: 'badge-gold', logout: 'bg-secondary' }
  return m[a] || 'bg-secondary'
}

async function fetchLogs(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const params = { page, per_page: 20 }
    if (filters.action) params.action = filters.action
    if (filters.entity_type) params.entity_type = filters.entity_type
    if (filters.status) params.status = filters.status
    const res = await logService.getAll(params)
    logs.value = res.data?.data || res.data || []
    totalPages.value = res.data?.last_page || 1
  } catch (_) { logs.value = [] } finally { loading.value = false }
}

onMounted(() => fetchLogs())
</script>

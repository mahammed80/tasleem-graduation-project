<template>
  <div>
    <div class="page-header">
      <div class="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item"><RouterLink to="/admin">Admin</RouterLink></li>
            <li class="breadcrumb-item active">Users</li>
          </ol>
        </nav>
        <h1 class="text-cream mb-0"><i class="bi bi-people me-2 text-gold"></i>User Management</h1>
      </div>
    </div>

    <div class="container py-4">
      <!-- Filters -->
      <div class="card p-3 mb-4">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label">Search</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="filters.search" type="search" class="form-control" placeholder="Name or email..." @input="debouncedFetch" />
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label">Role</label>
            <select v-model="filters.role" class="form-select form-select-sm" @change="fetchUsers(1)">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Status</label>
            <select v-model="filters.status" class="form-select form-select-sm" @change="fetchUsers(1)">
              <option value="">All</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-gold btn-sm w-100" @click="resetFilters">
              <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card p-0 overflow-hidden">
        <div class="card-header px-4 py-3 d-flex align-items-center justify-content-between">
          <span class="text-cream">{{ total }} user{{ total !== 1 ? 's' : '' }}</span>
        </div>
        <LoadingSpinner v-if="loading" height="200px" />
        <div class="table-responsive" v-else>
          <table class="table mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>State</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="users.length === 0">
                <td colspan="7" class="text-center text-muted py-4">No users found</td>
              </tr>
              <tr v-for="user in users" :key="user.id">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dark),var(--gold));display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;color:var(--navy);flex-shrink:0;">
                      {{ (user.name||'U')[0].toUpperCase() }}
                    </div>
                    <span class="text-cream" style="font-size:.88rem;">{{ user.name }}</span>
                    <span v-if="String(user.status) === '0'" class="badge bg-danger" style="font-size:.58rem;">Inactive</span>
                  </div>
                </td>
                <td class="text-muted" style="font-size:.85rem;">{{ user.email }}</td>
                <td class="text-muted" style="font-size:.85rem;">{{ user.phone || '—' }}</td>
                <td>
                  <select class="form-select form-select-sm" style="width:110px;background:var(--navy-light);" :value="user.role" @change="updateRole(user, $event.target.value)">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span v-if="stateOf(user)" class="badge" :class="stateOf(user).cls" style="font-size:.62rem;">
                    <i :class="stateOf(user).icon + ' me-1'"></i>{{ stateOf(user).label }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="text-muted" style="font-size:.82rem;">{{ formatDate(user.created_at) }}</td>
                <td>
                  <div class="d-flex gap-1">
                    <button class="btn btn-sm px-2 py-1"
                      :style="String(user.status) === '0'
                        ? 'background:rgba(46,204,113,.12);border:1px solid rgba(46,204,113,.3);color:#2ecc71;'
                        : 'background:rgba(243,156,18,.12);border:1px solid rgba(243,156,18,.3);color:#f39c12;'"
                      @click="toggleStatus(user)"
                      :disabled="busyId === user.id"
                      :title="String(user.status) === '0' ? 'Activate' : 'Deactivate'">
                      <i class="bi" :class="String(user.status) === '0' ? 'bi-person-check' : 'bi-person-slash'"></i>
                    </button>
                    <button class="btn btn-sm px-2 py-1" style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);color:#e74c3c;" @click="deleteUser(user)" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-3 py-2">
          <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchUsers" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { userService } from '@/services/api'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const toast = useToast()
const users = ref([])
const loading = ref(true)
const total = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const busyId = ref(null)
const filters = reactive({ search: '', role: '', status: '' })

let debounceTimer = null
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => fetchUsers(1), 350) }

function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-EG', { month:'short', day:'numeric', year:'numeric' }) : '—' }

// Trust state shown in the "State" column: Top (≥10 sales) / Trusted (≥3) / Verified (National ID).
function stateOf(u) {
  if (!u || u.role === 'admin') return null
  const sales = Number(u.completed_sales || 0)
  if (sales >= 10) return { label: 'Top', cls: 'badge-gold', icon: 'bi bi-award-fill' }
  if (sales >= 3)  return { label: 'Trusted', cls: 'bg-info text-dark', icon: 'bi bi-star-fill' }
  if (u.national_id) return { label: 'Verified', cls: 'bg-success', icon: 'bi bi-patch-check-fill' }
  return null
}
function resetFilters() { filters.search=''; filters.role=''; filters.status=''; fetchUsers(1) }

async function fetchUsers(page = 1) {
  loading.value = true
  try {
    const params = { page, per_page: 15, search: filters.search||undefined, role: filters.role||undefined, status: filters.status||undefined }
    const res = await userService.getAll(params)
    const meta = res.data?.pagination || {}
    users.value = res.data?.data || res.data || []
    total.value = meta.total ?? users.value.length
    totalPages.value = meta.last_page ?? 1
    currentPage.value = page
  } catch (_) { users.value = [] } finally { loading.value = false }
}

// Activate ('1') / deactivate ('0') — a deactivated user is blocked at login (403).
async function toggleStatus(user) {
  const next = String(user.status) === '0' ? '1' : '0'
  busyId.value = user.id
  try {
    await userService.update(user.id, { status: next })
    user.status = next
    toast.success(next === '0' ? `${user.name} deactivated` : `${user.name} activated`)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to update status')
  } finally {
    busyId.value = null
  }
}

async function updateRole(user, newRole) {
  try {
    await userService.update(user.id, { role: newRole })
    user.role = newRole
    toast.success(`Role updated to ${newRole}`)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to update role')
  }
}

async function deleteUser(user) {
  if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return
  try {
    await userService.delete(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
    total.value--
    toast.success('User deleted')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Delete failed')
  }
}

onMounted(() => fetchUsers())
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 1060;
  background: rgba(0,0,0,.65);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(4px);
}
</style>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="text-cream mb-0">Users Management</h5>
      <div class="d-flex gap-2">
        <input v-model="search" class="form-control form-control-sm" placeholder="Search by name or email..." style="width:220px;" @input="debouncedFetch" />
        <select class="form-select form-select-sm" v-model="roleFilter" @change="fetchUsers(1)" style="width:auto;">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>
    </div>

    <LoadingSpinner v-if="loading" height="200px" />

    <div v-else class="card overflow-hidden">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Joined</th>
              <th>Status</th>
              <th style="width:100px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="users.length === 0">
              <td colspan="6" class="text-center text-muted py-4">No users found</td>
            </tr>
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div style="width:34px;height:34px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:var(--navy);flex-shrink:0;">
                    {{ (user.name || 'U')[0].toUpperCase() }}
                  </div>
                  <div>
                    <div class="text-cream" style="font-size:.85rem;font-weight:500;">{{ user.name }}</div>
                    <div class="text-muted" style="font-size:.72rem;">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <select class="form-select form-select-sm" :value="user.role" @change="updateRole(user, $event.target.value)" style="width:auto;font-size:.78rem;padding:.2rem .4rem;">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td class="text-muted" style="font-size:.82rem;">{{ user.phone || '—' }}</td>
              <td class="text-muted" style="font-size:.78rem;">{{ formatDate(user.created_at) }}</td>
              <td>
                <span class="badge" :class="user.email_verified_at ? 'bg-success' : 'bg-warning text-dark'" style="font-size:.68rem;">
                  {{ user.email_verified_at ? 'Verified' : 'Unverified' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-danger px-2 py-1" @click="deleteUser(user)" title="Delete" v-if="user.id !== currentUserId">
                  <i class="bi bi-trash" style="font-size:.75rem;"></i>
                </button>
                <span class="text-muted" style="font-size:.75rem;" v-else>You</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchUsers" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const auth = useAuthStore()
const toast = useToast()
const users = ref([])
const loading = ref(true)
const search = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const currentUserId = auth.user?.id

function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' }) : '' }

let dt = null
function debouncedFetch() { clearTimeout(dt); dt = setTimeout(() => fetchUsers(1), 400) }

async function fetchUsers(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const res = await userService.getAll({ page, per_page: 15, search: search.value || undefined, role: roleFilter.value || undefined })
    users.value = res.data?.data || res.data || []
    totalPages.value = res.data?.last_page || 1
  } catch (_) { users.value = [] } finally { loading.value = false }
}

async function updateRole(user, newRole) {
  try {
    await userService.update(user.id, { role: newRole })
    user.role = newRole
    toast.success(`${user.name}'s role updated to ${newRole}`)
  } catch (e) { toast.error(e.response?.data?.message || 'Failed to update role') }
}

async function deleteUser(user) {
  if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return
  try {
    await userService.delete(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
    toast.success('User deleted')
  } catch (e) { toast.error(e.response?.data?.message || 'Failed to delete user') }
}

onMounted(() => fetchUsers())
</script>

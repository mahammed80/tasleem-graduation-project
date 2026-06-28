<template>
  <div>
    <div class="page-header">
      <div class="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item"><RouterLink to="/admin">Admin</RouterLink></li>
            <li class="breadcrumb-item active">Activity Logs</li>
          </ol>
        </nav>
        <h1 class="text-cream mb-0"><i class="bi bi-journal-code me-2 text-gold"></i>Activity Logs</h1>
      </div>
    </div>

    <div class="container py-4">
      <!-- Filters -->
      <div class="card p-3 mb-4">
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label">Action Type</label>
            <select v-model="filters.action" class="form-select form-select-sm" @change="fetchLogs(1)">
              <option value="">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Entity Type</label>
            <select v-model="filters.module" class="form-select form-select-sm" @change="fetchLogs(1)">
              <option value="">All Entities</option>
              <option value="users">Users</option>
              <option value="products">Products</option>
              <option value="orders">Orders</option>
              <option value="rentals">Rentals</option>
              <option value="payments">Payments</option>
              <option value="reviews">Reviews</option>
              <option value="offers">Offers</option>
              <option value="categories">Categories</option>
              <option value="wishlist">Wishlist</option>
            </select>
          </div>
          <div class="col-md-3 position-relative">
            <label class="form-label">User (name or email)</label>
            <div class="position-relative">
              <input v-model="userQuery" type="text" class="form-control form-control-sm" placeholder="search a user…" autocomplete="off" @input="searchUsers" />
              <button v-if="filters.user_id" type="button" class="btn btn-sm p-0 position-absolute text-muted" style="right:8px;top:5px;" @click="clearUser" title="Clear"><i class="bi bi-x-circle"></i></button>
            </div>
            <div v-if="userResults.length" class="user-dropdown">
              <button v-for="u in userResults" :key="u.id" type="button" class="user-opt" @click="pickUser(u)">
                <span class="text-cream">{{ u.name }}</span>
                <span class="text-muted ms-2" style="font-size:.74rem;">{{ u.email }}</span>
              </button>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label">Status</label>
            <select v-model="filters.status" class="form-select form-select-sm" @change="fetchLogs(1)">
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div class="col-12">
            <button class="btn btn-outline-gold btn-sm" @click="resetFilters">
              <i class="bi bi-arrow-counterclockwise me-1"></i>Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Log table -->
      <div class="card p-0 overflow-hidden">
        <div class="card-header px-4 py-3 d-flex align-items-center justify-content-between">
          <span class="text-cream">{{ total }} log{{ total !== 1 ? 's' : '' }}</span>
          <button class="btn btn-sm btn-outline-gold" @click="fetchLogs(1)">
            <i class="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>

        <LoadingSpinner v-if="loading" height="240px" />
        <div class="table-responsive" v-else>
          <table class="table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Entity</th>
                <th>User</th>
                <th>Status</th>
                <th>IP</th>
                <th>MAC</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="logs.length === 0">
                <td colspan="9" class="text-center text-muted py-5">No logs found</td>
              </tr>
              <tr v-for="log in logs" :key="log.log_id" :class="{'table-danger-subtle': log.status==='failed'}">
                <td class="text-muted" style="font-size:.78rem;">{{ log.log_id }}</td>
                <td>
                  <span class="badge" :class="actionBadge(log.action_type)">
                    <i :class="actionIcon(log.action_type)" class="me-1"></i>{{ log.action_type || 'ACTION' }}
                  </span>
                  <div class="text-muted" style="font-size:.74rem;">{{ log.action_name || log.message || log.module }}</div>
                </td>
                <td>
                  <span class="text-cream" style="font-size:.85rem;">{{ log.entity_type || log.module || '—' }}</span>
                  <span class="text-muted ms-1" style="font-size:.78rem;" v-if="log.entity_id">#{{ log.entity_id }}</span>
                </td>
                <td>
                  <span class="text-muted" style="font-size:.82rem;">{{ log.user?.name || (log.user?.id ? 'User #'+log.user.id : 'Guest') }}</span>
                </td>
                <td>
                  <span class="badge" :class="log.status==='success' ? 'bg-success' : 'bg-danger'">{{ log.status || 'success' }}</span>
                </td>
                <td class="text-muted" style="font-size:.78rem;">{{ log.ip_address || '—' }}</td>
                <td class="text-muted" style="font-size:.76rem;font-family:var(--font-mono,monospace);">{{ log.mac_address || '—' }}</td>
                <td class="text-muted" style="font-size:.78rem; white-space:nowrap;">{{ formatDate(log.created_at) }}</td>
                <td class="text-nowrap">
                  <button v-if="log.user?.id && log.user?.role !== 'admin'" class="btn btn-sm btn-link text-danger p-0 me-2"
                    @click="deleteUser(log.user)" title="Delete this user">
                    <i class="bi bi-person-x"></i>
                  </button>
                  <button class="btn btn-sm btn-link text-muted p-0" @click="expandedLog = expandedLog === log.log_id ? null : log.log_id" title="Details">
                    <i class="bi" :class="expandedLog===log.log_id ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                  </button>
                </td>
              </tr>
              <!-- Expanded detail row -->
              <template v-for="log in logs" :key="'detail-'+log.log_id">
                <tr v-if="expandedLog === log.log_id">
                  <td colspan="9" style="background:var(--navy-light);padding:1rem;">
                    <!-- Who did this — full user details -->
                    <div class="mb-3 d-flex flex-wrap align-items-center gap-3" v-if="log.user" style="background:var(--navy);border-radius:.5rem;padding:.6rem .85rem;">
                      <span class="text-cream fw-600" style="font-size:.86rem;"><i class="bi bi-person-circle me-1 text-gold"></i>{{ log.user.name || 'User #' + log.user.id }}</span>
                      <span class="text-muted" style="font-size:.82rem;"><i class="bi bi-envelope me-1 text-gold"></i>{{ log.user.email || '—' }}</span>
                      <span class="text-muted" style="font-size:.82rem;"><i class="bi bi-telephone me-1 text-gold"></i>{{ log.user.phone || '—' }}</span>
                      <span class="text-muted" style="font-size:.82rem;"><i class="bi bi-geo-alt me-1 text-gold"></i>{{ log.user.city || '—' }}</span>
                      <span class="text-muted" style="font-size:.82rem;"><i class="bi bi-hash text-gold"></i>{{ log.user.id }}</span>
                    </div>
                    <div class="mb-2" v-if="log.message">
                      <span class="text-muted" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;">Message:</span>
                      <span class="text-cream ms-1" style="font-size:.85rem;">{{ log.message }}</span>
                    </div>
                    <div class="text-muted mb-2" style="font-size:.78rem;" v-if="log.user_agent">
                      <i class="bi bi-pc-display me-1"></i>{{ log.user_agent }}
                    </div>
                    <div class="row g-3">
                      <div class="col-md-6" v-if="log.old_data">
                        <div class="text-muted mb-1" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;">Before</div>
                        <pre class="mb-0 text-cream" style="font-size:.75rem;background:var(--navy);padding:.75rem;border-radius:.5rem;overflow-x:auto;">{{ pretty(log.old_data) }}</pre>
                      </div>
                      <div class="col-md-6" v-if="log.new_data">
                        <div class="text-muted mb-1" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;">After</div>
                        <pre class="mb-0 text-cream" style="font-size:.75rem;background:var(--navy);padding:.75rem;border-radius:.5rem;overflow-x:auto;">{{ pretty(log.new_data) }}</pre>
                      </div>
                      <div class="col-12" v-if="!log.old_data && !log.new_data && !log.message">
                        <span class="text-muted" style="font-size:.82rem;">No detail data available</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="p-3">
          <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchLogs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { logService, userService } from '@/services/api'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const toast = useToast()

// Quickly remove a suspicious user straight from a log row.
async function deleteUser(u) {
  if (!confirm(`Delete user "${u.name}" (#${u.id})? This permanently removes the account.`)) return
  try {
    await userService.delete(u.id)
    toast.success(`User "${u.name}" deleted`)
    fetchLogs(currentPage.value)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to delete user')
  }
}

// User typeahead → resolves a name/email to a user_id for the logs filter.
const userQuery = ref('')
const userResults = ref([])
let userTimer = null
function searchUsers() {
  const q = userQuery.value.trim()
  if (q.length < 2) { userResults.value = []; return }
  clearTimeout(userTimer)
  userTimer = setTimeout(async () => {
    try {
      const res = await userService.getAll({ search: q, per_page: 6 })
      userResults.value = res.data?.data || res.data || []
    } catch (_) { userResults.value = [] }
  }, 300)
}
function pickUser(u) {
  filters.user_id = u.id
  userQuery.value = u.name
  userResults.value = []
  fetchLogs(1)
}
function clearUser() {
  filters.user_id = ''
  userQuery.value = ''
  userResults.value = []
  fetchLogs(1)
}

const logs = ref([])
const loading = ref(true)
const total = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const expandedLog = ref(null)
const filters = reactive({ action: '', module: '', user_id: '', status: '' })

let debounceTimer = null
function debouncedFetch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => fetchLogs(1), 350) }
function resetFilters() { Object.assign(filters, { action:'', module:'', user_id:'', status:'' }); userQuery.value=''; userResults.value=[]; fetchLogs(1) }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-EG', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

function actionBadge(t) {
  const m = { CREATE:'bg-success', UPDATE:'bg-info text-dark', DELETE:'bg-danger', VIEW:'bg-secondary', LOGIN:'badge-gold', LOGOUT:'bg-secondary' }
  return m[(t || '').toUpperCase()] || 'bg-secondary'
}
function actionIcon(t) {
  const m = { CREATE:'bi bi-plus-circle', UPDATE:'bi bi-pencil', DELETE:'bi bi-trash', VIEW:'bi bi-eye', LOGIN:'bi bi-box-arrow-in-right', LOGOUT:'bi bi-box-arrow-right' }
  return m[(t || '').toUpperCase()] || 'bi bi-activity'
}
// old_data / new_data arrive as JSON strings — pretty-print them.
function pretty(v) {
  if (v == null) return ''
  try { return JSON.stringify(typeof v === 'string' ? JSON.parse(v) : v, null, 2) }
  catch (_) { return String(v) }
}

async function fetchLogs(page = 1) {
  loading.value = true
  expandedLog.value = null
  try {
    const params = { page, per_page: 20, action: filters.action||undefined, module: filters.module||undefined, user_id: filters.user_id||undefined, status: filters.status||undefined }
    const res = await logService.getAll(params)
    const meta = res.data?.pagination || {}
    logs.value = res.data?.data || res.data || []
    total.value = meta.total ?? logs.value.length
    totalPages.value = meta.last_page ?? 1
    currentPage.value = page
  } catch (_) { logs.value = [] } finally { loading.value = false }
}

onMounted(() => fetchLogs())
</script>

<style scoped>
.user-dropdown {
  position: absolute; z-index: 30; left: 12px; right: 12px; top: 100%;
  background: var(--navy-card); border: 1px solid var(--navy-border);
  border-radius: .6rem; box-shadow: 0 8px 24px rgba(0,0,0,.45);
  max-height: 240px; overflow-y: auto; margin-top: 2px;
}
.user-opt {
  display: block; width: 100%; text-align: left; background: transparent;
  border: none; padding: .5rem .75rem; font-size: .85rem; border-bottom: 1px solid var(--navy-border);
}
.user-opt:last-child { border-bottom: none; }
.user-opt:hover { background: rgba(201,169,110,.08); }
</style>

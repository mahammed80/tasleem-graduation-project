<template>
  <div>
    <div class="page-header">
      <div class="container">
        <div class="d-flex align-items-center gap-3">
          <div class="p-2 rounded-xl" style="background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.2);">
            <i class="bi bi-shield-fill-check text-gold" style="font-size:1.5rem;"></i>
          </div>
          <div>
            <h1 class="text-cream mb-0">Admin Dashboard</h1>
            <p class="text-muted mb-0" style="font-size:.85rem;">Platform overview & management</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <!-- KPI cards -->
      <div class="row g-3 mb-5">
        <div class="col-6 col-md-3" v-for="kpi in kpis" :key="kpi.label">
          <div class="card p-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-muted" style="font-size:.8rem;text-transform:uppercase;letter-spacing:.07em;">{{ kpi.label }}</span>
              <div class="p-2 rounded" :style="{background: kpi.bg}">
                <i :class="kpi.icon" :style="{color: kpi.color, fontSize:'1rem'}"></i>
              </div>
            </div>
            <div class="text-cream" style="font-size:1.75rem;font-weight:800;line-height:1;">
              <span v-if="kpi.loading" class="skeleton d-inline-block" style="width:60px;height:1.75rem;"></span>
              <span v-else>{{ kpi.value }}</span>
            </div>
            <div class="text-muted mt-1" style="font-size:.75rem;">{{ kpi.sub }}</div>
          </div>
        </div>
      </div>

      <!-- Revenue breakdown + by source -->
      <div class="row g-3 mb-5">
        <div class="col-lg-7">
          <div class="card p-4 h-100">
            <h6 class="text-cream mb-3">Revenue breakdown</h6>
            <div class="bd-line"><span>Tasleem store sales</span><b>{{ money(breakdown.tasleemSales) }}</b></div>
            <div class="bd-line"><span>Platform fees (commission + delivery)</span><b>{{ money(breakdown.fees) }}</b></div>
            <div class="bd-line"><span>Boosts</span><b>{{ money(breakdown.boosts) }}</b></div>
            <hr class="divider-gold my-2" />
            <div class="bd-line"><span class="text-cream fw-700">Total platform revenue</span><b class="text-gold fs-5">{{ money(revenue) }}</b></div>
            <div class="bd-line mt-2" style="opacity:.8;"><span>Marketplace volume (sellers' gross)</span><b>{{ money(breakdown.marketplaceVolume) }}</b></div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card p-4 h-100">
            <h6 class="text-cream mb-3">By source</h6>
            <div class="text-muted mb-1" style="font-size:.8rem;">Products</div>
            <div class="d-flex gap-2 mb-3">
              <div class="src-pill"><span class="badge badge-gold">Tasleem</span> {{ breakdown.tProd }}</div>
              <div class="src-pill"><span class="badge bg-info text-dark">Users</span> {{ breakdown.cProd }}</div>
            </div>
            <div class="text-muted mb-1" style="font-size:.8rem;">Orders</div>
            <div class="d-flex gap-2">
              <div class="src-pill"><span class="badge badge-gold">Tasleem</span> {{ breakdown.tOrd }}</div>
              <div class="src-pill"><span class="badge bg-info text-dark">Users</span> {{ breakdown.cOrd }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction ledger (each movement: balance before → amount → balance after) -->
      <div class="card p-0 overflow-hidden mb-5">
        <div class="card-header px-4 py-3 d-flex align-items-center justify-content-between">
          <h6 class="text-cream mb-0">Transaction ledger</h6>
          <span class="text-muted" style="font-size:.78rem;">Each payout / fee movement on the Tasleem account</span>
        </div>
        <LoadingSpinner v-if="txLoading" height="160px" />
        <div v-else-if="txns.length === 0" class="text-center text-muted py-4" style="font-size:.88rem;">No transactions yet.</div>
        <div v-else class="table-responsive">
          <table class="table mb-0 align-middle">
            <thead><tr><th>Type</th><th>Reference</th><th>Date</th><th class="text-end">Balance before</th><th class="text-end">Amount</th><th class="text-end">Balance after</th></tr></thead>
            <tbody>
              <tr v-for="t in txns" :key="t.id">
                <td><span class="badge" :class="txCredit(t) ? 'bg-success' : 'bg-danger'" style="font-size:.62rem;">{{ txType(t) }}</span></td>
                <td class="text-muted" style="font-size:.8rem;">{{ txRef(t) }}</td>
                <td class="text-muted" style="font-size:.8rem;">{{ formatDateTime(t.created_at) }}</td>
                <td class="text-end text-muted" style="font-size:.84rem;">{{ money(txBefore(t)) }}</td>
                <td class="text-end fw-700" :class="txCredit(t) ? 'text-success' : 'text-danger'" style="font-size:.84rem;">{{ txCredit(t) ? '+' : '-' }}{{ money(Math.abs(Number(t.amount || 0))) }}</td>
                <td class="text-end text-cream fw-600" style="font-size:.84rem;">{{ money(Number(t.balance_after || 0)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick links -->
      <div class="row g-3 mb-5">
        <div class="col-md-6">
          <RouterLink to="/admin/users" class="card p-4 d-flex flex-row align-items-center gap-3 card-hover text-decoration-none">
            <div style="width:52px;height:52px;border-radius:1rem;background:rgba(52,152,219,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i class="bi bi-people text-info" style="font-size:1.5rem;"></i>
            </div>
            <div>
              <div class="text-cream fw-600">User Management</div>
              <div class="text-muted" style="font-size:.83rem;">View, edit, and manage all user accounts and roles</div>
            </div>
            <i class="bi bi-arrow-right text-muted ms-auto"></i>
          </RouterLink>
        </div>
        <div class="col-md-6">
          <RouterLink to="/admin/logs" class="card p-4 d-flex flex-row align-items-center gap-3 card-hover text-decoration-none">
            <div style="width:52px;height:52px;border-radius:1rem;background:rgba(201,169,110,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i class="bi bi-journal-code text-gold" style="font-size:1.5rem;"></i>
            </div>
            <div>
              <div class="text-cream fw-600">Activity Logs</div>
              <div class="text-muted" style="font-size:.83rem;">Track all system actions, entity changes, and audit trail</div>
            </div>
            <i class="bi bi-arrow-right text-muted ms-auto"></i>
          </RouterLink>
        </div>
        <div class="col-md-6">
          <RouterLink to="/admin/products" class="card p-4 d-flex flex-row align-items-center gap-3 card-hover text-decoration-none">
            <div style="width:52px;height:52px;border-radius:1rem;background:rgba(46,204,113,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i class="bi bi-box-seam" style="font-size:1.5rem;color:#2ecc71;"></i>
            </div>
            <div>
              <div class="text-cream fw-600">Products</div>
              <div class="text-muted" style="font-size:.83rem;">Manage listings — edit price, add stock, by source</div>
            </div>
            <i class="bi bi-arrow-right text-muted ms-auto"></i>
          </RouterLink>
        </div>
        <div class="col-md-6">
          <RouterLink to="/admin/orders" class="card p-4 d-flex flex-row align-items-center gap-3 card-hover text-decoration-none">
            <div style="width:52px;height:52px;border-radius:1rem;background:rgba(155,89,182,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i class="bi bi-bag-check" style="font-size:1.5rem;color:#9b59b6;"></i>
            </div>
            <div>
              <div class="text-cream fw-600">Orders</div>
              <div class="text-muted" style="font-size:.83rem;">Track orders, change status, complete &amp; pay sellers</div>
            </div>
            <i class="bi bi-arrow-right text-muted ms-auto"></i>
          </RouterLink>
        </div>
      </div>

      <!-- Recent users -->
      <div class="card p-0 overflow-hidden">
        <div class="card-header px-4 py-3 d-flex align-items-center justify-content-between">
          <h6 class="text-cream mb-0">Recent Users</h6>
          <RouterLink class="btn btn-outline-gold btn-sm" to="/admin/users">View All</RouterLink>
        </div>
        <LoadingSpinner v-if="usersLoading" height="160px" />
        <div class="table-responsive" v-else>
          <table class="table mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in recentUsers" :key="user.id">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dark),var(--gold));display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:var(--navy);flex-shrink:0;">
                      {{ (user.name||'U')[0].toUpperCase() }}
                    </div>
                    <span class="text-cream" style="font-size:.88rem;">{{ user.name }}</span>
                  </div>
                </td>
                <td class="text-muted" style="font-size:.85rem;">{{ user.email }}</td>
                <td><span class="badge" :class="roleBadge(user.role)">{{ user.role || 'user' }}</span></td>
                <td class="text-muted" style="font-size:.82rem;">{{ formatDate(user.created_at) }}</td>
                <td>
                  <RouterLink :to="`/admin/users`" class="btn btn-sm btn-outline-gold px-2 py-1">
                    <i class="bi bi-arrow-right"></i>
                  </RouterLink>
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
import { userService, adminService, walletService } from '@/services/api'
import { unwrap, unwrapList, formatPrice as money, formatDateTime } from '@/utils/helpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const recentUsers = ref([])
const usersLoading = ref(true)
const stats = ref(null)
const countsLoading = ref(true)
const txns = ref([])
const txLoading = ref(true)

// Per-transaction ledger helpers (balance_before is derived: after − amount).
const txCredit = t => Number(t.amount || 0) >= 0
const txBefore = t => Number(t.balance_after || 0) - Number(t.amount || 0)
const txType = t => ({
  topup: 'Top-up', hold: 'Hold', release: 'Sale', payout: 'Payout',
  refund: 'Refund', boost_fee: 'Boost fee',
}[t.type] || t.type || 'Txn')
const txRef = t => (t.ref_id && t.ref_id !== 0)
  ? `${({ offer: 'Offer', rental: 'Rental', boost: 'Listing' }[t.ref_type] || 'Order')} #${t.ref_id}`
  : (t.description || '—')

const revenue = computed(() => {
  const r = stats.value?.revenue || {}
  // Boosts are income — the backend reports them negative, so use the magnitude.
  return Number(r.tasleem_sales || 0) + Number(r.tasleem_fees || 0) + Number(r.delivery_fees || 0) + Math.abs(Number(r.boost_revenue || 0))
})

const kpis = computed(() => {
  const s = stats.value || {}
  return [
    { label: 'Total Users', value: s.users?.total ?? 0,    icon: 'bi bi-people-fill',    color: '#3498db', bg: 'rgba(52,152,219,.1)',    sub: `${s.users?.active ?? 0} active`, loading: countsLoading.value },
    { label: 'Products',    value: s.products?.total ?? 0,  icon: 'bi bi-box-seam-fill',  color: '#2ecc71', bg: 'rgba(46,204,113,.1)',    sub: `${s.products?.c2c ?? 0} from users`, loading: countsLoading.value },
    { label: 'Orders',      value: s.orders?.total ?? 0,    icon: 'bi bi-bag-check-fill', color: 'var(--gold)', bg: 'rgba(201,169,110,.1)', sub: `${s.orders?.pending ?? 0} pending`, loading: countsLoading.value },
    { label: 'Revenue',     value: formatPrice(revenue.value), icon: 'bi bi-cash-coin', color: '#9b59b6', bg: 'rgba(155,89,182,.1)', sub: 'Platform earnings', loading: countsLoading.value },
  ]
})

// Tasleem (B2C) vs Marketplace (C2C) + revenue breakdown
const breakdown = computed(() => {
  const r = stats.value?.revenue || {}
  const p = stats.value?.products || {}
  const o = stats.value?.orders || {}
  return {
    tasleemSales: Number(r.tasleem_sales || 0),
    fees: Number(r.tasleem_fees || 0) + Number(r.delivery_fees || 0),
    marketplaceVolume: Number(r.c2c_sales || 0),
    boosts: Math.abs(Number(r.boost_revenue || 0)),
    tProd: p.tasleem ?? 0, cProd: p.c2c ?? 0,
    tOrd: o.tasleem ?? 0, cOrd: o.c2c ?? 0,
  }
})

function formatPrice(v) { return new Intl.NumberFormat('en-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(v || 0) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-EG', { month:'short', day:'numeric', year:'numeric' }) : '—' }
function roleBadge(role) {
  const m = { admin: 'bg-danger', seller: 'bg-warning text-dark', user: 'badge-gold' }
  return m[role] || 'badge-gold'
}

onMounted(async () => {
  try {
    const [statsRes, usersRes, walletRes] = await Promise.all([
      adminService.stats().catch(() => null),
      userService.getAll({ per_page: 5, page: 1 }),
      walletService.get().catch(() => null),
    ])
    if (statsRes) stats.value = unwrap(statsRes)
    recentUsers.value = unwrapList(usersRes)
    if (walletRes) {
      const w = unwrap(walletRes) || {}
      txns.value = (w.transactions || w.data?.transactions || []).slice(0, 50)
    }
  } catch (_) {} finally { usersLoading.value = false; countsLoading.value = false; txLoading.value = false }
})
</script>

<style scoped>
.bd-line { display:flex; justify-content:space-between; gap:.75rem; margin-bottom:.5rem; font-size:.9rem; color:var(--text-muted); }
.bd-line b { color:var(--text-main); font-weight:600; }
.src-pill { background:var(--navy-light); border:1px solid var(--navy-border); border-radius:.6rem; padding:.4rem .7rem; font-weight:700; color:var(--text-main); font-size:.9rem; }
</style>

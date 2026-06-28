<template>
  <div>
    <div class="page-header">
      <div class="container">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h1 class="text-cream mb-1"><i class="bi bi-shop me-2 text-gold"></i>Seller Dashboard</h1>
            <p class="text-muted mb-0">Manage your listings and track your performance.</p>
          </div>
          <RouterLink class="btn btn-gold px-4" to="/seller/products/new">
            <i class="bi bi-plus-lg me-2"></i>List New Product
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <!-- Stats row -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3" v-for="stat in stats" :key="stat.label">
          <div class="card p-3 text-center">
            <i :class="stat.icon + ' fs-2 mb-2'" style="color:var(--gold);"></i>
            <div class="text-cream" style="font-size:1.6rem;font-weight:800;">{{ stat.loading ? '—' : stat.value }}</div>
            <div class="text-muted" style="font-size:.8rem;">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- Products table -->
      <div class="card p-0 overflow-hidden">
        <div class="card-header d-flex align-items-center justify-content-between px-4 py-3">
          <h5 class="text-cream mb-0">My Products</h5>
          <div class="d-flex gap-2">
            <input v-model="search" type="search" class="form-control form-control-sm" style="width:200px;" placeholder="Search..." />
          </div>
        </div>

        <LoadingSpinner v-if="loading" height="200px" />
        <div v-else-if="filteredProducts.length === 0" class="text-center py-5">
          <i class="bi bi-box-seam text-muted" style="font-size:2.5rem;"></i>
          <p class="text-muted mt-2">No products yet.</p>
          <RouterLink class="btn btn-gold btn-sm" to="/seller/products/new">List your first product</RouterLink>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th style="width:56px;"></th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Rentable</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in filteredProducts" :key="product.id">
                <td>
                  <div style="width:44px;height:44px;border-radius:.5rem;overflow:hidden;background:var(--navy-light);">
                    <img :src="pimg(product)" style="width:100%;height:100%;object-fit:cover;" v-if="pimg(product)" />
                    <div class="d-flex align-items-center justify-content-center h-100" v-else><i class="bi bi-image text-muted" style="font-size:.8rem;"></i></div>
                  </div>
                </td>
                <td>
                  <div class="text-cream" style="font-size:.9rem;font-weight:500;">{{ product.name }}</div>
                  <div class="text-muted" style="font-size:.75rem;">#{{ product.id }}</div>
                </td>
                <td><span class="badge badge-gold">{{ product.category?.name || '—' }}</span></td>
                <td>
                  <div v-if="editingId === product.id" class="d-flex align-items-center gap-1">
                    <input v-model.number="editPrice" type="number" min="0" step="1" class="form-control form-control-sm" style="width:90px;" @keyup.enter="savePrice(product)" />
                    <button class="btn btn-sm btn-gold px-2 py-1" @click="savePrice(product)" :disabled="savingId === product.id" title="Save">
                      <span v-if="savingId === product.id" class="spinner-border spinner-border-sm" style="width:10px;height:10px;"></span>
                      <i v-else class="bi bi-check-lg"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-gold px-2 py-1" @click="editingId = null" title="Cancel"><i class="bi bi-x"></i></button>
                  </div>
                  <button v-else class="btn btn-sm p-0 text-gold fw-600 d-inline-flex align-items-center gap-1" @click="startEdit(product)" title="Click to edit price">
                    {{ formatPrice(product.price) }}<i class="bi bi-pencil" style="font-size:.7rem;opacity:.6;"></i>
                  </button>
                </td>
                <td>
                  <span :class="stockOf(product) > 0 ? 'text-success' : 'text-danger'" style="font-weight:500;">{{ stockOf(product) }}</span>
                </td>
                <td>
                  <i class="bi" :class="isRentable(product) ? 'bi-check-circle-fill text-success' : 'bi-x-circle text-muted'"></i>
                </td>
                <td>
                  <span class="badge" :class="stockOf(product) > 0 ? 'bg-success' : 'bg-warning text-dark'">{{ stockOf(product) > 0 ? 'Active' : 'Out of Stock' }}</span>
                  <span v-if="isBoosted(product)" class="badge badge-gold ms-1" title="Boosted"><i class="bi bi-rocket-takeoff-fill"></i></span>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <RouterLink :to="`/products/${product.id}`" class="btn btn-sm btn-outline-gold px-2 py-1" title="View">
                      <i class="bi bi-eye"></i>
                    </RouterLink>
                    <button class="btn btn-sm px-2 py-1" :class="isBoosted(product) ? 'btn-gold' : 'btn-outline-gold'"
                      :title="isBoosted(product) ? 'Boosted' : 'Boost listing'" @click="openBoost(product)">
                      <i class="bi bi-rocket-takeoff" style="font-size:.72rem;"></i>
                    </button>
                    <button class="btn btn-sm px-2 py-1" style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);color:#e74c3c;" @click="deleteProduct(product)" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination v-if="totalPages > 1" :current-page="currentPage" :total-pages="totalPages" @change="fetchProducts" class="p-3" />
      </div>
    </div>

    <!-- Boost modal -->
    <Transition name="fade">
      <div v-if="boostProduct" class="boost-overlay" @click.self="boostProduct = null">
        <div class="card p-4" style="max-width:400px;width:100%;border-radius:1.25rem;">
          <div class="d-flex align-items-center gap-2 mb-1">
            <i class="bi bi-rocket-takeoff-fill text-gold fs-5"></i>
            <h5 class="text-cream mb-0">Boost Listing</h5>
          </div>
          <p class="text-muted mb-3" style="font-size:.84rem;">Show <strong class="text-cream">{{ boostProduct.name }}</strong> at the top of feeds and search.</p>

          <label class="form-label">Duration</label>
          <div class="d-flex align-items-center justify-content-center gap-3 mb-3">
            <button class="btn btn-outline-gold rounded-circle" style="width:42px;height:42px;" @click="boostDays = Math.max(1, boostDays - 1)"><i class="bi bi-dash-lg"></i></button>
            <div class="text-center" style="min-width:90px;">
              <div class="text-gold fw-800" style="font-size:2rem;line-height:1;">{{ boostDays }}</div>
              <div class="text-muted" style="font-size:.78rem;">day{{ boostDays > 1 ? 's' : '' }}</div>
            </div>
            <button class="btn btn-outline-gold rounded-circle" style="width:42px;height:42px;" @click="boostDays = Math.min(30, boostDays + 1)"><i class="bi bi-plus-lg"></i></button>
          </div>

          <div class="d-flex justify-content-between mb-1"><span class="text-muted">Cost ({{ boostDays }} × EGP 20)</span><span class="text-gold fw-700">EGP {{ boostDays * 20 }}</span></div>
          <div class="d-flex justify-content-between mb-3"><span class="text-muted">Wallet balance</span><span class="text-cream">EGP {{ Number(auth.user?.wallet_balance || 0).toLocaleString() }}</span></div>

          <div class="alert py-2 px-3 mb-3" v-if="(boostDays * 20) > Number(auth.user?.wallet_balance || 0)" style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);font-size:.82rem;color:#e74c3c;">
            <i class="bi bi-exclamation-circle me-1"></i>Not enough wallet balance. Top up first.
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-gold w-100" @click="confirmBoost"
              :disabled="boostBusy || (boostDays * 20) > Number(auth.user?.wallet_balance || 0)">
              <span class="spinner-border spinner-border-sm me-2" v-if="boostBusy"></span>
              <i class="bi bi-rocket-takeoff me-1" v-else></i>Boost for EGP {{ boostDays * 20 }}
            </button>
            <button class="btn btn-outline-gold" @click="boostProduct = null">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { userService, productService, boostService } from '@/services/api'
import { productImage, isBoosted } from '@/utils/helpers'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const auth = useAuthStore()
const toast = useToast()
const products = ref([])
const loading = ref(true)
const search = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const editingId = ref(null)   // product whose price is being edited inline
const editPrice = ref(0)
const savingId = ref(null)

// Real API field names (the resource uses quantity/images/type, not stock/image/is_rentable).
const pimg = p => productImage(p)
const stockOf = p => Number(p.quantity ?? 0)
const isRentable = p => p.type === 'rental' || p.type === 'both'

function startEdit(product) {
  editingId.value = product.id
  editPrice.value = Number(product.price) || 0
}

async function savePrice(product) {
  const price = Number(editPrice.value)
  if (!(price >= 0)) { toast.error('Enter a valid price'); return }
  savingId.value = product.id
  try {
    // Backend product update requires status alongside the changed field.
    await productService.updateFields(product.id, { price, status: product.status ?? '1' })
    product.price = price
    editingId.value = null
    toast.success('Price updated')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to update price')
  } finally { savingId.value = null }
}

// Boost a listing — in-page modal with a day stepper + EGP 20/day from wallet.
const boostProduct = ref(null)
const boostDays = ref(3)
const boostBusy = ref(false)

function openBoost(product) {
  if (isBoosted(product)) { toast.info('This listing is already boosted'); return }
  boostProduct.value = product
  boostDays.value = 3
}

async function confirmBoost() {
  const product = boostProduct.value
  if (!product) return
  boostBusy.value = true
  try {
    await boostService.boost(product.id, boostDays.value)
    product.is_boosted = true
    toast.success(`Boosted for ${boostDays.value} day${boostDays.value > 1 ? 's' : ''} — EGP ${boostDays.value * 20} from your wallet`)
    await auth.fetchMe()  // refresh wallet balance
    boostProduct.value = null
  } catch (e) {
    toast.error(e.response?.data?.message || 'Boost failed — check your wallet balance')
  } finally { boostBusy.value = false }
}

const statsData = ref({ total: 0, active: 0, rentable: 0, outOfStock: 0 })
const stats = computed(() => [
  { icon: 'bi bi-box-seam', label: 'Total Products', value: statsData.value.total, loading: loading.value },
  { icon: 'bi bi-check-circle', label: 'Active', value: statsData.value.active, loading: loading.value },
  { icon: 'bi bi-clock-history', label: 'Rentable', value: statsData.value.rentable, loading: loading.value },
  { icon: 'bi bi-exclamation-circle', label: 'Out of Stock', value: statsData.value.outOfStock, loading: loading.value },
])

const filteredProducts = computed(() => {
  if (!search.value) return products.value
  const q = search.value.toLowerCase()
  return products.value.filter(p => p.name?.toLowerCase().includes(q) || p.category?.name?.toLowerCase().includes(q))
})

function formatPrice(v) { return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(v || 0) }

async function fetchProducts(page = 1) {
  loading.value = true
  try {
    const res = await userService.getProducts(auth.user.id)
    products.value = res.data?.data || res.data || []
    totalPages.value = res.data?.last_page || 1
    currentPage.value = page
    statsData.value = {
      total: products.value.length,
      active: products.value.filter(p => stockOf(p) > 0).length,
      rentable: products.value.filter(p => isRentable(p)).length,
      outOfStock: products.value.filter(p => stockOf(p) <= 0).length
    }
  } catch (_) { products.value = [] } finally { loading.value = false }
}

async function deleteProduct(product) {
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
  try {
    await productService.delete(product.id)
    products.value = products.value.filter(p => p.id !== product.id)
    statsData.value.total--
    toast.success('Product deleted')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Delete failed')
  }
}

onMounted(() => fetchProducts())
</script>

<style scoped>
.boost-overlay {
  position: fixed; inset: 0; z-index: 1060; background: rgba(0,0,0,.65);
  display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px);
}
</style>

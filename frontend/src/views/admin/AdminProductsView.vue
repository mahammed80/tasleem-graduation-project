<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-box-seam text-gold me-2"></i>Products Management</h1>
      </div>
    </div>

    <div class="container py-4">
      <div class="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <button v-for="s in sources" :key="s.v" class="btn btn-sm" :class="source===s.v ? 'btn-gold' : 'btn-outline-gold'" @click="source=s.v; fetchProducts()">{{ s.l }}</button>
        <span class="vr mx-1"></span>
        <button v-for="f in stockFilters" :key="f.v" class="btn btn-sm" :class="stock===f.v ? 'btn-gold' : 'btn-outline-gold'" @click="stock=f.v; fetchProducts()">
          <i :class="f.icon + ' me-1'" style="font-size:.7rem;"></i>{{ f.l }}
        </button>
        <input v-model="search" class="form-control form-control-sm ms-auto" placeholder="Search products…" style="width:220px;" @input="debounced" />
      </div>

      <LoadingSpinner v-if="loading" height="240px" />
      <div v-else class="card overflow-hidden">
        <div class="table-responsive">
          <table class="table mb-0 align-middle">
            <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Category</th><th style="width:170px;">Actions</th></tr></thead>
            <tbody>
              <tr v-if="filtered.length===0"><td colspan="5" class="text-center text-muted py-4">No products</td></tr>
              <tr v-for="p in filtered" :key="p.id">
                <td>
                  <RouterLink :to="`/products/${p.id}`" class="d-flex align-items-center gap-2 text-decoration-none">
                    <div class="rounded overflow-hidden flex-shrink-0" style="width:36px;height:36px;background:var(--navy-light);">
                      <img v-if="img(p)" :src="img(p)" style="width:100%;height:100%;object-fit:cover;" />
                    </div>
                    <div>
                      <div class="text-cream" style="font-size:.84rem;">{{ p.name }}</div>
                      <span class="badge" :class="isAdmin(p.owner) ? 'badge-gold' : 'bg-info text-dark'" style="font-size:.6rem;">{{ isAdmin(p.owner) ? 'Tasleem' : 'Seller' }}</span>
                    </div>
                  </RouterLink>
                </td>
                <td class="text-gold fw-700" style="font-size:.85rem;">{{ formatPrice(p.price) }}</td>
                <td :class="stockOk(p) ? 'text-cream' : 'text-danger'" style="font-size:.82rem;">{{ stockLabel(p) }}</td>
                <td class="text-muted" style="font-size:.78rem;">{{ p.category?.name || '—' }}</td>
                <td>
                  <div class="d-flex gap-1">
                    <!-- Price/stock are only editable on Tasleem (admin) products, never on a user's listing. -->
                    <template v-if="isAdmin(p.owner)">
                      <button class="btn btn-sm btn-outline-gold px-2 py-1" title="Edit price" @click="editPrice(p)"><i class="bi bi-tag" style="font-size:.72rem;"></i></button>
                      <button class="btn btn-sm btn-outline-gold px-2 py-1" title="Add stock" @click="addStock(p)"><i class="bi bi-plus-square" style="font-size:.72rem;"></i></button>
                    </template>
                    <span v-else class="text-muted" style="font-size:.7rem;align-self:center;" title="User listing — managed by the seller"><i class="bi bi-lock"></i> seller-managed</span>
                    <button class="btn btn-sm btn-outline-danger px-2 py-1" title="Delete" @click="del(p)"><i class="bi bi-trash" style="font-size:.72rem;"></i></button>
                  </div>
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
import { productService } from '@/services/api'
import { useToast } from 'vue-toastification'
import { unwrapList, productImage, isAdminOwned as isAdmin, formatPrice } from '@/utils/helpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const toast = useToast()
const products = ref([])
const loading = ref(true)
const search = ref('')
const source = ref('all')
const sources = [{ v: 'all', l: 'All' }, { v: 'tasleem', l: 'Tasleem' }, { v: 'users', l: 'Users' }]
const stock = ref('all')
const stockFilters = [
  { v: 'all', l: 'All stock', icon: 'bi bi-boxes' },
  { v: 'in', l: 'In stock', icon: 'bi bi-check-circle' },
  { v: 'out', l: 'Out of stock', icon: 'bi bi-x-circle' },
]

const img = p => productImage(p)
const stockOk = p => p.status === '1' && (p.quantity ?? 0) > 0
function stockLabel(p) {
  if (isAdmin(p.owner)) return stockOk(p) ? `${p.quantity} left` : 'Out of stock'
  return stockOk(p) ? 'Available' : 'Sold'
}
const filtered = computed(() => {
  let list = products.value
  if (source.value !== 'all') list = list.filter(p => (source.value === 'tasleem') === isAdmin(p.owner))
  if (stock.value === 'in') list = list.filter(p => stockOk(p))
  else if (stock.value === 'out') list = list.filter(p => !stockOk(p))
  return list
})

let dt = null
function debounced() { clearTimeout(dt); dt = setTimeout(fetchProducts, 400) }

async function fetchProducts() {
  loading.value = true
  try {
    // Filter on the server so out-of-stock / source results are complete, not
    // just whatever fell on the first page.
    const params = { per_page: 100, sort_by: 'created_at', sort_order: 'desc', search: search.value || undefined }
    if (stock.value === 'out') params.status = '0'        // sold out / inactive
    else if (stock.value === 'in') params.status = '1'    // active
    if (source.value !== 'all') params.source = source.value
    const res = await productService.getAll(params, { timeout: 30000 })
    products.value = unwrapList(res)
  } catch (_) { products.value = [] } finally { loading.value = false }
}

async function editPrice(p) {
  const v = prompt(`New price for "${p.name}" (EGP)`, p.price)
  if (v === null) return
  const price = Number(v)
  if (!(price > 0)) { toast.error('Invalid price'); return }
  try {
    await productService.updateFields(p.id, { price, status: p.status }) // backend requires status
    p.price = price
    toast.success('Price updated')
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
}

async function addStock(p) {
  const v = prompt(`Add how many units to "${p.name}"?`, '1')
  if (v === null) return
  const add = parseInt(v, 10)
  if (!(add > 0)) { toast.error('Invalid quantity'); return }
  try {
    const quantity = (p.quantity || 0) + add
    await productService.updateFields(p.id, { quantity, status: '1' })
    p.quantity = quantity; p.status = '1'
    toast.success(`Added ${add} — now ${quantity}`)
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
}

async function del(p) {
  if (!confirm(`Delete "${p.name}"?`)) return
  try {
    await productService.delete(p.id)
    products.value = products.value.filter(x => x.id !== p.id)
    toast.success('Deleted')
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
}

onMounted(fetchProducts)
</script>

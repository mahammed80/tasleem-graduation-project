<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div class="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item"><RouterLink to="/">Home</RouterLink></li>
            <li class="breadcrumb-item active">Products</li>
          </ol>
        </nav>
        <h1 class="text-cream mb-0">All Products</h1>
      </div>
    </div>

    <div class="container py-4">
      <div class="row g-4">
        <!-- Filters sidebar -->
        <div class="col-lg-3">
          <div class="card p-3 sticky-top" style="top:80px;">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="text-cream mb-0">Filters</h6>
              <button class="btn btn-sm text-gold p-0" @click="resetFilters">Reset</button>
            </div>

            <!-- Search -->
            <div class="mb-3">
              <label class="form-label">Search</label>
              <input 
                v-model="filters.search" 
                type="search" 
                class="form-control form-control-sm" 
                placeholder="Search products..." 
                @input="debouncedFetch" 
              />
            </div>

            <!-- Category -->
            <div class="mb-3">
              <label class="form-label">Category</label>
              <select 
                v-model="filters.category_id" 
                class="form-select form-select-sm" 
                @change="onCategoryChange"
              >
                <option value="">All Categories</option>
                <option 
                  v-for="cat in categories" 
                  :key="cat.id || cat.category_id" 
                  :value="String(cat.id || cat.category_id)"
                >
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <!-- Rentable toggle -->
            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  v-model="filters.rentable"
                  id="rentable"
                  @change="fetchProducts(1)"
                />
                <label class="form-check-label text-muted" for="rentable">Rentable only</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="filters.inStock" id="inStock" />
                <label class="form-check-label text-muted" for="inStock">In stock only</label>
              </div>
            </div>

            <!-- Price range -->
            <div class="mb-3">
              <label class="form-label">
                Max Price: <span class="text-gold">{{ formatPrice(filters.max_price) }}</span>
              </label>
              <input 
                type="range" 
                class="form-range" 
                v-model="filters.max_price" 
                min="0" 
                max="50000" 
                step="100" 
                @change="fetchProducts(1)" 
              />
              <div class="d-flex justify-content-between text-muted" style="font-size:.75rem;">
                <span>0</span>
                <span>50,000 EGP</span>
              </div>
            </div>

            <!-- Sort -->
            <div>
              <label class="form-label">Sort By</label>
              <select 
                v-model="filters.sort" 
                class="form-select form-select-sm" 
                @change="fetchProducts(1)"
              >
                <option value="">Default (Newest)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Products grid -->
        <div class="col-lg-9">
          <!-- Source tabs: Tasleem store vs user listings -->
          <ul class="nav nav-pills gap-2 mb-3">
            <li class="nav-item" v-for="s in sources" :key="s.v">
              <button class="nav-link" :class="{ active: source === s.v }" @click="source = s.v">
                <i :class="s.icon + ' me-1'"></i>{{ s.l }}
              </button>
            </li>
          </ul>
          <!-- Toolbar -->
          <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div class="text-muted" style="font-size:.9rem;">
              <span v-if="!loading">{{ total }} product{{ total !== 1 ? 's' : '' }} found</span>
              <span v-else>Loading...</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button 
                class="btn btn-sm" 
                :class="viewMode === 'grid' ? 'btn-gold' : 'btn-outline-gold'" 
                @click="viewMode = 'grid'"
              >
                <i class="bi bi-grid-3x3-gap"></i>
              </button>
              <button 
                class="btn btn-sm" 
                :class="viewMode === 'list' ? 'btn-gold' : 'btn-outline-gold'" 
                @click="viewMode = 'list'"
              >
                <i class="bi bi-list"></i>
              </button>
            </div>
          </div>

          <!-- Grid view -->
          <div class="row g-4" v-if="viewMode === 'grid'">
            <div class="col-6 col-md-4 col-xl-4" v-for="product in shown" :key="product.id">
              <ProductCard :product="product" />
            </div>
            <div class="col-6 col-md-4 col-xl-4" v-if="loading" v-for="n in 9" :key="'sk'+n">
              <ProductSkeleton />
            </div>
          </div>

          <!-- List view -->
          <div class="d-flex flex-column gap-3" v-else>
            <div
              class="card card-hover p-0 overflow-hidden"
              v-for="product in shown"
              :key="product.id"
              @click="$router.push({ name: 'ProductDetail', params: { id: product.id } })" 
              style="cursor:pointer;"
            >
              <div class="d-flex">
                <div style="width:140px; flex-shrink:0; background:var(--navy-light); height:120px; overflow:hidden;">
                  <img 
                    :src="getProductImage(product)" 
                    :alt="product.name" 
                    style="width:100%; height:100%; object-fit:cover;" 
                    v-if="getProductImage(product)" 
                  />
                  <div class="d-flex align-items-center justify-content-center h-100" v-else>
                    <i class="bi bi-image text-muted fs-3"></i>
                  </div>
                </div>
                <div class="p-3 flex-grow-1 d-flex align-items-center justify-content-between">
                  <div>
                    <span class="badge badge-gold mb-1" v-if="product.category">{{ product.category?.name }}</span>
                    <h6 class="text-cream mb-1">{{ product.name }}</h6>
                    <p class="text-muted mb-0" style="font-size:.82rem; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                      {{ product.description?.slice(0, 80) }}...
                    </p>
                  </div>
                  <div class="text-end ms-3 flex-shrink-0">
                    <div class="product-price mb-2">{{ formatPrice(product.price) }}</div>
                    <button class="btn btn-gold btn-sm" @click.stop="addToCart(product)">
                      <i class="bi bi-bag-plus me-1"></i>Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!loading && total === 0" class="text-center py-5">
            <i class="bi bi-search text-muted" style="font-size:3rem;"></i>
            <h5 class="text-muted mt-3">No products found</h5>
            <button class="btn btn-outline-gold btn-sm mt-2" @click="resetFilters">Clear Filters</button>
          </div>

          <!-- Pagination -->
          <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchProducts" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService, categoryService, aiService } from '@/services/api'
import { aiSearch } from '@/services/ai'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { unwrapList, pagination, productImage, hideMine } from '@/utils/helpers'
import ProductCard from '@/components/ui/ProductCard.vue'
import ProductSkeleton from '@/components/ui/ProductSkeleton.vue'
import Pagination from '@/components/ui/Pagination.vue'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const toast = useToast()

const products = ref([])
const categories = ref([])
const loading = ref(true)
const currentPage = ref(1)
const viewMode = ref('grid')
const PER = 24
const serverTotal = ref(0)
const serverPages = ref(1)
// 'server' = paged whole catalogue (All tab); 'client' = a focused set we
// filter/paginate locally (a source tab or a search), so Users/Tasleem are complete.
const pageMode = ref('server')

// Source tabs (client-side filter on the current page).
const source = ref('all')
const sources = [
  { v: 'all', l: 'All', icon: 'bi bi-grid' },
  { v: 'tasleem', l: 'Tasleem', icon: 'bi bi-shop' },
  { v: 'users', l: 'Users', icon: 'bi bi-people' },
]
const filtered = computed(() => {
  let list = hideMine(products.value, auth.user?.id) // never show my own listings
  if (source.value !== 'all') list = list.filter(p => (source.value === 'tasleem') === (p.owner?.role === 'admin'))
  if (filters.inStock) list = list.filter(p => p.status === '1' && Number(p.quantity ?? 0) > 0)
  return list
})
const total = computed(() => pageMode.value === 'client' ? filtered.value.length : serverTotal.value)
const totalPages = computed(() => pageMode.value === 'client'
  ? Math.max(1, Math.ceil(filtered.value.length / PER))
  : serverPages.value)
const shown = computed(() => {
  if (pageMode.value === 'client') {
    const p = Math.min(currentPage.value, totalPages.value)
    return filtered.value.slice((p - 1) * PER, p * PER)
  }
  return filtered.value // server mode: products.value is already one page
})

// FIX: Initialize category_id as empty string
const filters = reactive({
  search: route.query.search || '',
  category_id: route.query.category_id ? String(route.query.category_id) : '',
  rentable: route.query.rentable === '1',
  inStock: false,
  max_price: 50000,
  sort: 'rating' // default: Top Rated
})

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchProducts(1), 400)
}

function formatPrice(val) {
  return new Intl.NumberFormat('en-EG', { 
    style: 'currency', 
    currency: 'EGP', 
    maximumFractionDigits: 0 
  }).format(val || 0)
}

function getProductImage(product) {
  return productImage(product) || null
}

function onCategoryChange(event) {
  filters.category_id = event.target.value
  fetchProducts(1)
}

function getSortParams(sortValue) {
  const m = {
    price_asc:  { sort_by: 'price', sort_order: 'asc' },
    price_desc: { sort_by: 'price', sort_order: 'desc' },
    newest:     { sort_by: 'created_at', sort_order: 'desc' },
    oldest:     { sort_by: 'created_at', sort_order: 'asc' },
    rating:     { sort_by: 'rate', sort_order: 'desc' },
    popular:    { sort_by: 'view_count', sort_order: 'desc' },
  }
  return m[sortValue] || { sort_by: 'created_at', sort_order: 'desc' }
}

async function fetchProducts(page = 1) {
  loading.value = true
  currentPage.value = page
  const q = (filters.search || '').trim()
  const s = getSortParams(filters.sort)
  const common = {}
  if (filters.category_id) common.category_id = filters.category_id
  if (filters.rentable) common.type = 'rental'
  if (filters.max_price < 50000) common.max_price = filters.max_price
  try {
    if (q) {
      // Search → AI semantic results (client-paginated), keyword fallback.
      pageMode.value = 'client'
      const ai = await aiSearch(q, 48)
      products.value = (ai && ai.length)
        ? ai
        : unwrapList(await productService.getAll({ search: q, per_page: 48 }, { timeout: 30000 }))
    } else {
      // Browse — real server-side pagination. The backend ?source= filter keeps the
      // Tasleem / Users tabs complete and correctly paged (no client-side capping).
      pageMode.value = 'server'
      const params = { page, per_page: PER, sort_by: s.sort_by, sort_order: s.sort_order, ...common }
      if (source.value !== 'all') params.source = source.value
      const res = await productService.getAll(params, { timeout: 30000 })
      const meta = pagination(res)
      products.value = unwrapList(res)
      serverTotal.value = meta.total ?? products.value.length
      serverPages.value = meta.last_page ?? 1
    }
  } catch (e) {
    products.value = []
    toast.error('Failed to load products')
  } finally {
    loading.value = false
  }
}

async function addToCart(product) {
  if (!auth.isAuthenticated) { 
    toast.info('Please sign in to add to cart')
    return 
  }
  const res = await cart.addItem(product.id)
  if (res.success) { 
    toast.success('Added to cart!')
    cart.openCart() 
  } else {
    toast.error(res.message || 'Failed to add to cart')
  }
}

function resetFilters() {
  filters.search = ''
  filters.category_id = ''
  filters.rentable = false
  filters.inStock = false
  filters.max_price = 50000
  filters.sort = ''
  source.value = 'all'
  fetchProducts(1)
}

onMounted(async () => {
  try {
    const catRes = await categoryService.getAll()
    categories.value = catRes.data?.data || catRes.data || []
    
    // DEBUG: Log categories to see their structure
    console.log('Categories loaded:', categories.value)
    if (categories.value.length > 0) {
      console.log('First category structure:', categories.value[0])
    }
  } catch (e) {
    console.error('Failed to load categories:', e)
    toast.error('Failed to load categories')
  }
  
  await fetchProducts(1)
})

// React to a new search coming from the navbar (e.g. "See all results").
watch(() => route.query.search, (v) => {
  const val = v || ''
  if (val !== filters.search) {
    filters.search = val
    fetchProducts(1)
  }
})

// Switching Tasleem/Users/All changes the fetch strategy → reload.
watch(source, () => fetchProducts(1))
</script>

<style scoped>
.nav-pills .nav-link { color: var(--text-muted); background: var(--navy-light); border: 1px solid var(--navy-border); }
.nav-pills .nav-link.active { background: var(--gold); color: var(--navy); border-color: var(--gold); }
</style>
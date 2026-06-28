<template>
  <div>
    <div class="page-header">
      <div class="container">
        <form @submit.prevent="doSearch" class="mb-3" style="max-width:680px;">
          <div class="input-group input-group-lg">
            <span class="input-group-text"><i class="bi bi-search text-gold"></i></span>
            <input
              ref="inputRef"
              v-model="query"
              class="form-control"
              placeholder="Search products, categories, brands..."
              autocomplete="off"
              @input="onInput"
            />
            <button class="btn btn-gold px-4" type="submit">Search</button>
            <button v-if="query" class="btn btn-outline-gold" type="button" @click="clearSearch">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </form>

        <!-- Popular & recent searches -->
        <div v-if="!query" class="d-flex flex-wrap gap-2 align-items-center">
          <span class="text-muted" style="font-size:.8rem;">Popular:</span>
          <button
            v-for="s in popularSearches" :key="s"
            class="badge badge-gold cursor-pointer border-0 py-2 px-3"
            style="font-size:.78rem;"
            @click="query = s; doSearch()"
          >{{ s }}</button>
        </div>
        <div v-if="query && !loading" class="text-muted" style="font-size:.88rem;">
          {{ total }} result{{ total !== 1 ? 's' : '' }} for "<strong class="text-cream">{{ query }}</strong>"
        </div>
      </div>
    </div>

    <div class="container py-4">
      <!-- Suggestions while typing -->
      <div v-if="suggestions.length && !searched" class="mb-4">
        <p class="text-muted mb-2" style="font-size:.82rem;text-transform:uppercase;letter-spacing:.07em;">Suggestions</p>
        <div class="d-flex flex-wrap gap-2">
          <button v-for="s in suggestions" :key="s.id" class="card px-3 py-2 d-flex flex-row align-items-center gap-2 border-0" @click="query = s.name; doSearch()">
            <div style="width:36px;height:36px;border-radius:.5rem;overflow:hidden;background:var(--navy-light);">
              <img v-if="s.image" :src="s.image" style="width:100%;height:100%;object-fit:cover;" />
              <div v-else class="d-flex align-items-center justify-content-center h-100"><i class="bi bi-image text-muted" style="font-size:.7rem;"></i></div>
            </div>
            <span class="text-cream" style="font-size:.85rem;">{{ s.name }}</span>
            <span class="text-muted ms-1" style="font-size:.75rem;">{{ formatPrice(s.price) }}</span>
          </button>
        </div>
      </div>

      <!-- Loading skeletons -->
      <div class="row g-4" v-if="loading">
        <div class="col-6 col-md-4 col-xl-3" v-for="n in 8" :key="n">
          <ProductSkeleton />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="searched && results.length === 0" class="text-center py-5">
        <i class="bi bi-search text-muted" style="font-size:3.5rem;"></i>
        <h4 class="text-muted mt-3">No results for "{{ lastQuery }}"</h4>
        <p class="text-muted mb-4">Try different keywords, check spelling, or browse categories.</p>
        <div class="d-flex justify-content-center gap-2 flex-wrap">
          <button class="btn btn-outline-gold" @click="clearSearch">Clear Search</button>
          <RouterLink class="btn btn-gold" to="/products">Browse All Products</RouterLink>
        </div>
        <div class="mt-5">
          <p class="text-muted mb-3" style="font-size:.85rem;">You might like:</p>
          <div class="row g-3">
            <div class="col-6 col-md-4 col-xl-3" v-for="p in fallbackProducts" :key="p.id">
              <ProductCard :product="p" />
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div v-else-if="results.length > 0">
        <!-- Filters bar -->
        <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div class="d-flex gap-2 flex-wrap">
            <select v-model="sortBy" class="form-select form-select-sm" style="width:auto;" @change="doSearch">
              <option value="">Relevance</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
            </select>
            <select v-model="categoryFilter" class="form-select form-select-sm" style="width:auto;" @change="doSearch">
              <option value="">All Categories</option>
              <option v-for="cat in resultCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <span class="text-muted" style="font-size:.82rem;">{{ total }} results</span>
        </div>

        <div class="row g-4">
          <div class="col-6 col-md-4 col-xl-3" v-for="product in results" :key="product.id">
            <ProductCard :product="product" />
          </div>
        </div>

        <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchPage" />
      </div>

      <!-- Initial state - no search yet -->
      <div v-else-if="!searched && !loading" class="py-2">
        <p class="text-muted mb-4 section-title">Trending Now</p>
        <div class="row g-4 mt-2">
          <div class="col-6 col-md-4 col-xl-3" v-for="p in trendingProducts" :key="p.id">
            <ProductCard :product="p" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService } from '@/services/api'
import { aiSearch } from '@/services/ai'
import { unwrapList } from '@/utils/helpers'
import ProductCard from '@/components/ui/ProductCard.vue'
import ProductSkeleton from '@/components/ui/ProductSkeleton.vue'
import Pagination from '@/components/ui/Pagination.vue'

const route = useRoute()
const router = useRouter()
const inputRef = ref(null)
const query = ref(route.query.q || '')
const lastQuery = ref('')
const results = ref([])
const suggestions = ref([])
const trendingProducts = ref([])
const fallbackProducts = ref([])
const loading = ref(false)
const searched = ref(false)
const total = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const sortBy = ref('')
const categoryFilter = ref('')

const popularSearches = ['iPhone', 'Laptop', 'Camera', 'Sofa', 'Car', 'Watch', 'PlayStation']

const resultCategories = computed(() => [...new Set(results.value.map(p => p.category?.name).filter(Boolean))])

function formatPrice(v) { return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(v || 0) }

let suggestionTimer = null
async function onInput() {
  if (query.value.length < 2) { suggestions.value = []; return }
  clearTimeout(suggestionTimer)
  suggestionTimer = setTimeout(async () => {
    try {
      const res = await productService.getAll({ search: query.value, per_page: 5 })
      suggestions.value = res.data?.data || res.data || []
    } catch (_) {}
  }, 250)
}

async function doSearch() {
  if (!query.value.trim()) return
  suggestions.value = []
  loading.value = true
  searched.value = true
  lastQuery.value = query.value.trim()
  router.replace({ name: 'Search', query: { q: lastQuery.value } })
  await fetchPage(1)
}

// AI search returns one ranked list; cache it and paginate/sort client-side.
let aiCache = []
let lastAiQuery = ''
const PER = 12

function sortList(list, by) {
  const a = [...list]
  if (by === 'price_asc') a.sort((x, y) => (x.price || 0) - (y.price || 0))
  else if (by === 'price_desc') a.sort((x, y) => (y.price || 0) - (x.price || 0))
  else if (by === 'newest') a.sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0))
  else if (by === 'rating') a.sort((x, y) => (Number(y.rate ?? y.rating ?? 0)) - (Number(x.rate ?? x.rating ?? 0)))
  return a // '' = relevance → keep AI order
}

async function fetchPage(page = 1) {
  loading.value = true
  currentPage.value = page
  const q = (lastQuery.value || query.value || '').trim()
  try {
    // 1) AI semantic search (only re-fetch when the query text changes).
    if (q && q !== lastAiQuery) {
      aiCache = (await aiSearch(q, 48)) || []
      lastAiQuery = q
    }

    if (aiCache.length) {
      let list = aiCache
      if (categoryFilter.value) list = list.filter(p => p.category?.name === categoryFilter.value)
      list = sortList(list, sortBy.value)
      total.value = list.length
      totalPages.value = Math.max(1, Math.ceil(list.length / PER))
      results.value = list.slice((page - 1) * PER, page * PER)
    } else {
      // 2) Fallback: backend keyword (LIKE) search.
      const res = await productService.getAll({
        search: q, page, per_page: PER,
        sort: sortBy.value || undefined,
        category: categoryFilter.value || undefined,
      })
      results.value = unwrapList(res)
      total.value = res.data?.total || results.value.length
      totalPages.value = res.data?.last_page || 1
    }
    if (results.value.length === 0) await loadFallback()
  } catch (_) { results.value = [] } finally { loading.value = false }
}

async function loadFallback() {
  try {
    const res = await productService.getAll({ per_page: 4 })
    fallbackProducts.value = res.data?.data || res.data || []
  } catch (_) {}
}

function clearSearch() {
  query.value = ''
  results.value = []
  suggestions.value = []
  searched.value = false
  lastQuery.value = ''
  aiCache = []
  lastAiQuery = ''
  router.replace({ name: 'Search' })
  inputRef.value?.focus()
}

onMounted(async () => {
  inputRef.value?.focus()
  try {
    const res = await productService.getAll({ per_page: 8 })
    trendingProducts.value = res.data?.data || res.data || []
  } catch (_) {}
  if (query.value) doSearch()
})

watch(() => route.query.q, val => {
  if (val && val !== query.value) { query.value = val; doSearch() }
})
</script>

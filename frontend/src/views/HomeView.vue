<template>
  <div>
    <!-- Hero: dynamic Featured Deals carousel -->
    <section class="hero-wrap">
      <div class="container">
        <div class="hero-card" v-if="heroItems.length">
          <div class="hero-info">
            <span class="badge badge-gold mb-2" style="width:fit-content;">
              <i class="bi bi-star-fill me-1"></i>Featured Deal
            </span>
            <h1 class="hero-name">{{ heroProduct.name }}</h1>
            <p class="hero-cat mb-2" v-if="heroProduct.category">{{ heroProduct.category?.name }}</p>
            <div class="hero-price mb-3">{{ formatPrice(heroProduct.price) }}</div>
            <div class="d-flex gap-2">
              <RouterLink :to="`/products/${heroProduct.id}`" class="btn btn-gold px-4"><i class="bi bi-bag me-2"></i>View Deal</RouterLink>
              <RouterLink to="/products" class="btn btn-outline-gold px-4">Browse All</RouterLink>
            </div>
          </div>
          <div class="hero-media">
            <img v-if="heroImg" :src="heroImg" :alt="heroProduct.name" @error="heroImgError = true" />
            <i v-else class="bi bi-bag-heart text-gold" style="font-size:5rem;opacity:.6;"></i>
          </div>
          <div class="hero-dots" v-if="heroItems.length > 1">
            <span v-for="(p,i) in heroItems" :key="i" :class="{ active: i === heroIndex }" @click="setHero(i)"></span>
          </div>
        </div>
        <div class="hero-card hero-skeleton" v-else>
          <div class="hero-info"><div class="skeleton" style="height:2rem;width:60%;margin-bottom:1rem;"></div><div class="skeleton" style="height:1rem;width:40%;"></div></div>
        </div>
      </div>
    </section>

    <!-- Categories — horizontal scroll row -->
    <section class="py-4" style="background:var(--navy);">
      <div class="container">
        <div class="d-flex align-items-center gap-2 mb-3">
          <i class="bi bi-grid-3x3-gap text-gold fs-5"></i>
          <h2 class="section-title text-cream mb-0">Shop by Category</h2>
        </div>
        <div class="cat-row">
          <RouterLink v-for="cat in categories" :key="cat.id || cat.category_id"
            :to="{ path: '/products', query: { category_id: cat.id || cat.category_id } }" class="cat-chip">
            <i class="bi bi-tag text-gold"></i><span>{{ cat.name }}</span>
          </RouterLink>
          <div v-if="categoriesLoading" v-for="n in 6" :key="'cs'+n" class="cat-chip skeleton" style="min-width:120px;height:44px;"></div>
        </div>
      </div>
    </section>

    <ProductRow title="Featured Deals" icon="bi bi-star" :products="featuredProducts" :loading="productsLoading" see-all="/products" />
    <ProductRow :title="recSection" icon="bi bi-stars" :products="recommendations" :loading="recLoading" bg v-if="recommendations.length || recLoading" />
    <ProductRow title="Trending Now" icon="bi bi-fire" :products="trendingProducts" :loading="trendingLoading" />
    <ProductRow title="Explore More" icon="bi bi-compass" :products="exploreProducts" :loading="exploreLoading" bg />
    <!-- Browse-all CTA (instead of dumping the whole catalogue on the home page) -->
    <section class="container py-5 text-center">
      <h3 class="text-cream mb-2">Looking for something specific?</h3>
      <p class="text-muted mb-4">Browse the full catalogue — Tasleem store items and listings from sellers.</p>
      <RouterLink to="/products" class="btn btn-gold btn-lg px-5">
        <i class="bi bi-grid-3x3-gap me-2"></i>Show All Products
      </RouterLink>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { productService, categoryService } from '@/services/api'
import { aiTrending, aiExplore, aiRecommend } from '@/services/ai'
import { unwrapList, productImage, hideMine, boostedFirst, formatPrice } from '@/utils/helpers'
import ProductRow from '@/components/ui/ProductRow.vue'

const auth = useAuthStore()
const meId = computed(() => auth.user?.id)
const mine = list => hideMine(list, meId.value)

const featuredProducts = ref([])
const categories = ref([])
const recommendations = ref([])
const recSection = ref('For You')
const trendingProducts = ref([])
const exploreProducts = ref([])
const allProducts = ref([])
const productsLoading = ref(true)
const categoriesLoading = ref(true)
const trendingLoading = ref(true)
const exploreLoading = ref(true)
const recLoading = ref(false)
const allLoading = ref(true)

// ── Hero carousel ──
const heroIndex = ref(0)
const heroImgError = ref(false)
let heroTimer = null
const heroItems = computed(() => boostedFirst(featuredProducts.value).slice(0, 5))
const heroProduct = computed(() => heroItems.value[heroIndex.value] || {})
const heroImg = computed(() => heroImgError.value ? '' : productImage(heroProduct.value))
function setHero(i) { heroIndex.value = i; heroImgError.value = false }
watch(heroIndex, () => { heroImgError.value = false })

async function loadTrending() {
  trendingLoading.value = true
  try {
    const ai = await aiTrending(8)
    if (ai) { trendingProducts.value = mine(ai); return }
    const fb = await productService.getAll({ sort_by: 'view_count', sort_order: 'desc', per_page: 12 })
    trendingProducts.value = mine(unwrapList(fb)).slice(0, 8)
  } catch (_) { trendingProducts.value = [] } finally { trendingLoading.value = false }
}
async function loadExplore() {
  exploreLoading.value = true
  try {
    const ai = await aiExplore(8)
    if (ai) { exploreProducts.value = mine(ai); return }
    const fb = await productService.getAll({ sort_by: 'created_at', sort_order: 'desc', per_page: 12 })
    exploreProducts.value = mine(unwrapList(fb)).slice(0, 8)
  } catch (_) { exploreProducts.value = [] } finally { exploreLoading.value = false }
}
async function loadRecommendations() {
  recLoading.value = true
  try {
    const uid = meId.value
    if (uid) {
      const ai = await aiRecommend(uid, 8)
      if (ai && ai.products.length) { recommendations.value = mine(ai.products); recSection.value = ai.section; return }
    }
    const fb = await productService.getAll({ sort_by: 'view_count', sort_order: 'desc', per_page: 12 })
    recommendations.value = mine(unwrapList(fb)).slice(0, 8)
    recSection.value = 'Recommendations for You'
  } catch (_) { recommendations.value = [] } finally { recLoading.value = false }
}
async function loadAll() {
  allLoading.value = true
  try {
    const res = await productService.getAll({ sort_by: 'created_at', sort_order: 'desc', per_page: 16 })
    allProducts.value = boostedFirst(mine(unwrapList(res))).slice(0, 8)
  } catch (_) { allProducts.value = [] } finally { allLoading.value = false }
}

onMounted(async () => {
  try {
    const [catRes, featuredRes] = await Promise.all([
      categoryService.getAll(),
      productService.getAll({ per_page: 12, sort_by: 'rate', sort_order: 'desc' }),
    ])
    categories.value = catRes.data?.data || catRes.data || []
    featuredProducts.value = boostedFirst(mine(unwrapList(featuredRes))).slice(0, 8)
  } catch (e) { console.error('Home load failed:', e) } finally {
    productsLoading.value = false
    categoriesLoading.value = false
  }
  loadTrending(); loadRecommendations(); loadExplore()
  heroTimer = setInterval(() => {
    if (heroItems.value.length > 1) heroIndex.value = (heroIndex.value + 1) % heroItems.value.length
  }, 4500)
})
onUnmounted(() => clearInterval(heroTimer))
watch(() => auth.isAuthenticated, () => loadRecommendations())
</script>

<style scoped>
.hero-wrap { padding: 2rem 0; background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%); }
.hero-card { position: relative; display: flex; align-items: center; gap: 2rem; min-height: 300px;
  background: var(--navy-card); border: 1px solid var(--navy-border); border-radius: 1.5rem; padding: 2.5rem; overflow: hidden; }
.hero-info { flex: 1 1 55%; z-index: 2; }
.hero-name { font-size: 2.1rem; font-weight: 800; color: var(--text-cream); line-height: 1.15; }
.hero-cat { color: var(--text-muted); font-size: .95rem; }
.hero-price { font-size: 1.8rem; font-weight: 800; color: var(--gold); }
.hero-media { flex: 0 0 38%; height: 240px; border-radius: 1rem; overflow: hidden; background: var(--navy-light);
  display: flex; align-items: center; justify-content: center; }
.hero-media img { width: 100%; height: 100%; object-fit: cover; }
.hero-dots { position: absolute; bottom: 1rem; left: 2.5rem; display: flex; gap: 6px; }
.hero-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--navy-border); cursor: pointer; transition: .2s; }
.hero-dots span.active { background: var(--gold); width: 22px; border-radius: 4px; }
@media (max-width: 768px) { .hero-card { flex-direction: column; padding: 1.5rem; } .hero-media { width: 100%; flex-basis: auto; } .hero-name { font-size: 1.5rem; } }

.cat-row { display: flex; gap: .75rem; overflow-x: auto; padding-bottom: .5rem; }
.cat-chip { display: inline-flex; align-items: center; gap: .5rem; flex-shrink: 0; min-width: max-content;
  background: var(--navy-light); border: 1px solid var(--navy-border); border-radius: 999px; padding: .6rem 1.2rem;
  color: var(--text-cream); font-weight: 600; font-size: .9rem; text-decoration: none; transition: .15s; }
.cat-chip:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); }
.section-title { font-size: 1.6rem; font-weight: 700; }
.skeleton { background: linear-gradient(90deg, var(--navy-light) 25%, var(--navy-border) 50%, var(--navy-light) 75%);
  background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: .6rem; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>

<template>
  <section class="py-5" :style="bg ? 'background:var(--navy);' : ''" v-if="products.length || loading">
    <div class="container">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-2">
          <i :class="icon + ' text-gold fs-4'"></i>
          <h2 class="section-title text-cream mb-0">{{ title }}</h2>
        </div>
        <RouterLink v-if="seeAll" :to="seeAll" class="btn btn-outline-gold btn-sm">View All <i class="bi bi-arrow-right ms-1"></i></RouterLink>
      </div>
      <div class="row g-4">
        <div class="col-6 col-md-4 col-xl-3" v-for="p in products" :key="p.id">
          <ProductCard :product="p" />
        </div>
        <template v-if="loading && !products.length">
          <div class="col-6 col-md-4 col-xl-3" v-for="n in 8" :key="'sk'+n"><ProductSkeleton /></div>
        </template>
      </div>
      <div v-if="!loading && products.length === 0" class="text-center py-3">
        <p class="text-muted mb-0">Nothing here right now.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import ProductCard from '@/components/ui/ProductCard.vue'
import ProductSkeleton from '@/components/ui/ProductSkeleton.vue'

defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: 'bi bi-grid' },
  products: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  bg: { type: Boolean, default: false },
  seeAll: { type: String, default: '' },
})
</script>

<style scoped>
.section-title { font-size: 1.6rem; font-weight: 700; }
</style>

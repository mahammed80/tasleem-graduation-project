<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0">Categories</h1>
      </div>
    </div>
    <div class="container py-4">
      <LoadingSpinner v-if="loading" height="300px" />
      <div class="row g-4" v-else>
        <div class="col-6 col-md-4 col-lg-3" v-for="cat in categories" :key="cat.id">
          <RouterLink :to="`/products?category_id=${cat.id}`" class="text-decoration-none">
            <div class="card text-center p-4 card-hover cursor-pointer" style="border-radius:1.25rem;">
              <div class="fs-1 mb-3">{{ cat.icon || '📦' }}</div>
              <h5 class="text-cream mb-1">{{ cat.name }}</h5>
              <p class="text-muted mb-0" style="font-size:.85rem;">{{ cat.description || cat.products_count + ' products' }}</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categoryService } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const categories = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await categoryService.getAll()
    categories.value = res.data?.data || res.data || []
  } catch (_) {} finally { loading.value = false }
})
</script>

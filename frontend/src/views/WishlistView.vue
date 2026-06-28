<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-heart me-2 text-gold"></i>My Wishlist</h1>
      </div>
    </div>
    <div class="container py-4">
      <LoadingSpinner v-if="loading" height="300px" />
      <div v-else-if="wishlist.items.length === 0" class="text-center py-5">
        <i class="bi bi-heart text-muted" style="font-size:3rem;"></i>
        <h5 class="text-muted mt-3">Your wishlist is empty</h5>
        <RouterLink class="btn btn-gold mt-2" to="/products">Discover Products</RouterLink>
      </div>
      <div v-else>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="text-muted">{{ wishlist.count }} item{{ wishlist.count !== 1 ? 's' : '' }}</span>
          <button class="btn btn-sm text-danger p-0" @click="wishlist.items.forEach(i => wishlist.remove(i.product_id || i.id))">
            <i class="bi bi-trash me-1"></i>Clear All
          </button>
        </div>
        <div class="row g-4">
          <div class="col-6 col-md-4 col-xl-3" v-for="item in wishlist.items" :key="item.id">
            <ProductCard :product="item.product || item" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useWishlistStore } from '@/stores/wishlist'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ProductCard from '@/components/ui/ProductCard.vue'

const wishlist = useWishlistStore()
const loading = ref(true)

onMounted(async () => {
  await wishlist.fetchWishlist()
  loading.value = false
})
</script>

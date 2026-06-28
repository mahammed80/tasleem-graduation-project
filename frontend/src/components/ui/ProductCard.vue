<template>
  <div class="card product-card card-hover h-100" @click="goToProduct">
    <!-- Source badge: Tasleem store vs the seller's name -->
    <span class="product-badge source-badge" :class="isTasleem ? 'src-tasleem' : 'src-user'">
      <i :class="isTasleem ? 'bi bi-shop' : 'bi bi-person'"></i>{{ sellerLabel }}
    </span>
    <!-- Boosted ribbon -->
    <span v-if="boosted" class="boosted-badge"><i class="bi bi-rocket-takeoff-fill"></i>Boosted</span>
    <!-- Out of stock overlay -->
    <span v-if="outOfStock" class="oos-badge">Out of Stock</span>

    <!-- Wishlist -->
    <button
      class="wishlist-btn"
      :class="{ active: wishlist.isInWishlist(product.id) }"
      @click.stop="toggleWishlist"
    >
      <i :class="wishlist.isInWishlist(product.id) ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
    </button>

    <!-- Image -->
    <div class="product-img-wrap">
      <img
        v-if="productImage"
        :src="productImage"
        :alt="product.name"
        loading="lazy"
        @error="e => e.target.style.display='none'"
      />
      <i v-else class="bi bi-image no-img"></i>
    </div>

    <div class="card-body d-flex flex-column gap-2 p-3">
      <!-- Category -->
      <span class="badge badge-gold" style="width:fit-content; font-size:.7rem;" v-if="product.category">
        {{ product.category?.name || product.category }}
      </span>

      <!-- Name -->
      <h6 class="card-title text-cream mb-0 text-truncate" style="font-size:.95rem;">{{ product.name }}</h6>

      <!-- Stock status -->
      <span class="stock-tag" :class="outOfStock ? 'oos' : 'ins'">
        <i :class="outOfStock ? 'bi bi-x-circle' : 'bi bi-check-circle'"></i>
        {{ outOfStock ? 'Out of stock' : 'In stock' }}
      </span>

      <!-- Rating -->
      <div class="d-flex align-items-center gap-1 star-rating" v-if="product.rating">
        <template v-for="n in 5" :key="n">
          <i :class="n <= Math.round(product.rating) ? 'bi bi-star-fill filled' : 'bi bi-star empty'"></i>
        </template>
        <span class="text-muted ms-1" style="font-size:.78rem;">({{ product.reviews_count || 0 }})</span>
      </div>

      <!-- Price -->
      <div class="mt-auto d-flex align-items-center justify-content-between">
        <div>
          <span class="product-price">{{ formatPrice(product.price) }}</span>
          <span class="product-old-price ms-2" v-if="product.old_price">{{ formatPrice(product.old_price) }}</span>
        </div>
        <button class="btn btn-gold btn-sm px-3" @click.stop="addToCart" :disabled="cartLoading || outOfStock" :title="outOfStock ? 'Out of stock' : 'Add to cart'">
          <i class="bi bi-bag-plus" v-if="!cartLoading"></i>
          <span class="spinner-border spinner-border-sm" v-else></span>
        </button>
      </div>

      <!-- Rental price -->
      <div v-if="product.is_rentable && product.daily_rental_price" class="text-muted" style="font-size:.78rem;">
        <i class="bi bi-clock me-1"></i>{{ formatPrice(product.daily_rental_price) }}/day
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { productImage as resolveImage, isBoosted } from '@/utils/helpers'

const props = defineProps({ product: { type: Object, required: true } })
const router = useRouter()
const cart = useCartStore()
const wishlist = useWishlistStore()
const auth = useAuthStore()
const toast = useToast()
const cartLoading = ref(false)

const productImage = computed(() => resolveImage(props.product))
const isTasleem = computed(() => props.product.owner?.role === 'admin')
const boosted = computed(() => isBoosted(props.product))
const outOfStock = computed(() => props.product.status !== '1' || Number(props.product.quantity ?? 0) <= 0)
// Tasleem store → "Tasleem"; a user listing → the seller's name (not generic "Seller").
const sellerLabel = computed(() =>
  isTasleem.value ? 'Tasleem' : (props.product.owner?.name?.split(' ')[0] || 'Seller'))

function formatPrice(val) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(val || 0)
}

function goToProduct() {
  router.push({ name: 'ProductDetail', params: { id: props.product.id } })
}

async function addToCart() {
  if (!auth.isAuthenticated) {
    toast.info('Please sign in to add items to cart')
    router.push({ name: 'Login' })
    return
  }
  cartLoading.value = true
  const res = await cart.addItem(props.product.id)
  if (res.success) {
    toast.success('Added to cart!')
    cart.openCart()
  } else {
    toast.error(res.message)
  }
  cartLoading.value = false
}

async function toggleWishlist() {
  const res = await wishlist.toggle(props.product.id)
  if (res?.needsAuth) {
    toast.info('Please sign in to save items')
    router.push({ name: 'Login' })
    return
  }
  if (res?.added) toast.success('Added to wishlist')
  else if (res?.added === false) toast.info('Removed from wishlist')
  else if (res?.error) toast.error(res.error)
}
</script>

<style scoped>
.source-badge { display: inline-flex; align-items: center; gap: 4px; font-size: .68rem; font-weight: 700; }
.source-badge.src-tasleem { background: var(--gold); color: var(--navy); }
.source-badge.src-user { background: rgba(52,152,219,.9); color: #fff; }
.boosted-badge {
  position: absolute; top: 10px; right: 44px; z-index: 2;
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: var(--navy); font-size: .64rem; font-weight: 800;
  padding: 3px 8px; border-radius: 999px; box-shadow: 0 2px 8px rgba(201,169,110,.4);
}
.oos-badge {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-8deg); z-index: 3;
  background: rgba(231,76,60,.92); color: #fff; font-size: .72rem; font-weight: 800;
  padding: 4px 14px; border-radius: 6px; letter-spacing: .03em; box-shadow: 0 2px 10px rgba(0,0,0,.35);
}
.stock-tag {
  display: inline-flex; align-items: center; gap: 4px; width: fit-content;
  font-size: .68rem; font-weight: 700; padding: 1px 7px; border-radius: 999px;
}
.stock-tag.ins { background: rgba(46,204,113,.14); color: #2ecc71; }
.stock-tag.oos { background: rgba(231,76,60,.14); color: #e74c3c; }
</style>

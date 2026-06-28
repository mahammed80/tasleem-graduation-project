<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-bag me-2 text-gold"></i>Shopping Cart</h1>
      </div>
    </div>

    <div class="container py-4">
      <!-- Empty cart -->
      <div v-if="cart.isEmpty" class="text-center py-5">
        <i class="bi bi-bag-x text-muted" style="font-size:4rem;"></i>
        <h4 class="text-muted mt-3">Your cart is empty</h4>
        <RouterLink class="btn btn-gold mt-3" to="/products">Start Shopping</RouterLink>
      </div>

      <div class="row g-4" v-else>
        <!-- Cart items -->
        <div class="col-lg-8">
          <div class="card p-0 overflow-hidden">
            <div class="card-header d-flex justify-content-between align-items-center px-3 py-2">
              <span class="text-cream fw-600">{{ cart.totalItems }} Item{{ cart.totalItems !== 1 ? 's' : '' }}</span>
              <button class="btn btn-sm text-danger p-0" @click="cart.clearCart()">
                <i class="bi bi-trash me-1"></i>Clear All
              </button>
            </div>
            <TransitionGroup name="slide-up" tag="div">
              <div class="p-3 border-bottom cart-item-row" style="border-color:var(--navy-border)!important;" v-for="item in cart.items" :key="item.id">
                <div class="d-flex gap-3 align-items-start">
                  <div class="rounded-xl overflow-hidden flex-shrink-0" style="width:80px; height:80px; background:var(--navy-light);">
                    <img :src="cartImg(item)" style="width:100%; height:100%; object-fit:cover;" v-if="cartImg(item)" />
                    <div class="d-flex align-items-center justify-content-center h-100" v-else>
                      <i class="bi bi-image text-muted"></i>
                    </div>
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="text-cream mb-1">{{ item.name || item.product?.name }}</h6>
                    <div class="text-muted" style="font-size:.82rem;">{{ item.category?.name || '' }}</div>
                    <!-- Rental dates -->
                    <div v-if="item.type === 'rental'" class="badge badge-gold mt-1">
                      <i class="bi bi-calendar me-1"></i>{{ item.start_date }} → {{ item.end_date }}
                    </div>
                    <div class="d-flex align-items-center gap-2 mt-2">
                      <button class="qty-btn"
                        @click="cart.updateItem(item.id, (item.quantity || 1) - 1)"
                        :disabled="cart.isUpdating(item.id)">
                        <span v-if="cart.isUpdating(item.id)" class="spinner-border spinner-border-sm" style="width:8px;height:8px;border-width:1.5px;"></span>
                        <i v-else class="bi bi-dash" style="font-size:.7rem;"></i>
                      </button>
                      <span class="text-cream px-2" style="min-width:24px;text-align:center;">{{ item.quantity || 1 }}</span>
                      <button class="qty-btn"
                        @click="incQty(item)"
                        :disabled="cart.isUpdating(item.id) || atMax(item)">
                        <span v-if="cart.isUpdating(item.id)" class="spinner-border spinner-border-sm" style="width:8px;height:8px;border-width:1.5px;"></span>
                        <i v-else class="bi bi-plus" style="font-size:.7rem;"></i>
                      </button>
                      <span v-if="atMax(item) && stockOf(item) > 0" class="text-muted ms-1" style="font-size:.72rem;">Max {{ stockOf(item) }} in stock</span>
                    </div>
                  </div>
                  <div class="text-end d-flex flex-column align-items-end gap-2">
                    <span class="text-gold fw-700">{{ formatPrice((item.price || 0) * (item.quantity || 1)) }}</span>
                    <span class="text-muted" style="font-size:.78rem;">{{ formatPrice(item.price || 0) }} each</span>
                    <button class="btn btn-sm p-0 text-muted" @click="cart.removeItem(item.id)">
                      <i class="bi bi-x-circle"></i>
                    </button>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <!-- Order summary -->
        <div class="col-lg-4">
          <div class="card p-4 sticky-top" style="top:80px;">
            <h5 class="text-cream mb-4">Order Summary</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Subtotal ({{ cart.totalItems }} items)</span>
              <span class="text-cream">{{ formatPrice(cart.totalPrice) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Shipping</span>
              <span class="text-cream">{{ formatPrice(shipping) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" v-if="discount > 0">
              <span class="text-muted">Discount</span>
              <span style="color:#2ecc71;">-{{ formatPrice(discount) }}</span>
            </div>
            <hr class="divider-gold my-3" />
            <div class="d-flex justify-content-between mb-4">
              <span class="text-cream fw-700">Total</span>
              <span class="text-gold fw-700 fs-5">{{ formatPrice(cart.totalPrice + shipping - discount) }}</span>
            </div>

            <!-- Coupon -->
            <div class="mb-3">
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" placeholder="Coupon code" v-model="coupon" />
                <button class="btn btn-outline-gold" @click="applyCoupon">Apply</button>
              </div>
            </div>

            <RouterLink class="btn btn-gold w-100 py-2 mb-2" to="/checkout">
              <i class="bi bi-lock me-2"></i>Proceed to Checkout
            </RouterLink>
            <RouterLink class="btn btn-outline-gold w-100 btn-sm" to="/products">Continue Shopping</RouterLink>

            <!-- Trust badges -->
            <div class="d-flex justify-content-center gap-4 mt-4">
              <div class="text-center">
                <i class="bi bi-shield-lock text-gold d-block"></i>
                <span class="text-muted" style="font-size:.7rem;">Secure</span>
              </div>
              <div class="text-center">
                <i class="bi bi-truck text-gold d-block"></i>
                <span class="text-muted" style="font-size:.7rem;">Fast Delivery</span>
              </div>
              <div class="text-center">
                <i class="bi bi-arrow-return-left text-gold d-block"></i>
                <span class="text-muted" style="font-size:.7rem;">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useToast } from 'vue-toastification'
import { productImage } from '@/utils/helpers'

const cart = useCartStore()
const toast = useToast()
const shipping = ref(50)
const discount = ref(0)
const coupon = ref('')

// Robust thumbnail: prefer the normalized image, fall back to resolving the product.
const cartImg = item => item.image || productImage(item.product)
// Available stock for this item (rentals aren't quantity-capped).
const stockOf = item => Number(item.product?.quantity ?? item.stock ?? 0)
const atMax = item => item.type !== 'rental' && stockOf(item) > 0 && (item.quantity || 1) >= stockOf(item)

function incQty(item) {
  if (atMax(item)) {
    toast.info(`Only ${stockOf(item)} in stock`)
    return
  }
  cart.updateItem(item.id, (item.quantity || 1) + 1)
}

function formatPrice(v) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(v || 0)
}

function applyCoupon() {
  if (coupon.value.toUpperCase() === 'TASLEEM10') {
    discount.value = cart.totalPrice * 0.1
    toast.success('10% discount applied!')
  } else {
    toast.error('Invalid coupon code')
  }
}

onMounted(() => cart.fetchCart())
</script>

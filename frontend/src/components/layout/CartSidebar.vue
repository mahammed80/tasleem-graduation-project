<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div v-if="cart.open" class="offcanvas-backdrop show" @click="cart.closeCart()"></div>
  </Transition>

  <!-- Offcanvas -->
  <div class="offcanvas offcanvas-end cart-offcanvas" :class="{ show: cart.open }" tabindex="-1">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title text-cream d-flex align-items-center gap-2">
        <i class="bi bi-bag text-gold"></i> My Cart
        <span class="badge badge-gold ms-1" v-if="cart.totalItems > 0">{{ cart.totalItems }}</span>
      </h5>
      <button type="button" class="btn-close btn-close-white" @click="cart.closeCart()"></button>
    </div>

    <div class="offcanvas-body d-flex flex-column" style="overflow-y:auto;">
      <!-- Empty state -->
      <div v-if="cart.isEmpty" class="text-center py-5 flex-grow-1 d-flex flex-column align-items-center justify-content-center">
        <i class="bi bi-bag-x text-muted" style="font-size:3.5rem;"></i>
        <p class="text-muted mt-3">Your cart is empty</p>
        <RouterLink class="btn btn-gold btn-sm mt-2" to="/products" @click="cart.closeCart()">Explore Products</RouterLink>
      </div>

      <!-- Items -->
      <div v-else class="flex-grow-1">
        <TransitionGroup name="slide-up" tag="div">
          <div v-for="item in cart.items" :key="item.id" class="cart-item">
            <img
              :src="item.image || item.product?.image"
              :alt="item.name || item.product?.name"
              class="cart-item-img"
              @error="e => e.target.src = '/placeholder.jpg'"
            />
            <div class="flex-grow-1 min-w-0">
              <div class="cart-item-name text-truncate">{{ item.name || item.product?.name }}</div>

              <!-- Rental badge -->
              <div v-if="item.type === 'rental'" class="badge badge-gold mt-1" style="font-size:.65rem;">
                <i class="bi bi-calendar me-1"></i>{{ item.start_date }} → {{ item.end_date }}
              </div>

              <!-- Qty controls -->
              <div class="d-flex align-items-center gap-2 mt-1">
                <button
                  class="qty-btn"
                  @click="decreaseQty(item)"
                  :disabled="cart.isUpdating(item.id)"
                >
                  <span v-if="cart.isUpdating(item.id) && (item.quantity||1) > 1"
                    class="spinner-border spinner-border-sm" style="width:8px;height:8px;border-width:1.5px;"></span>
                  <i v-else class="bi bi-dash" style="font-size:.7rem;"></i>
                </button>

                <span class="text-cream" style="font-size:.9rem; min-width:20px; text-align:center;">
                  {{ item.quantity || 1 }}
                </span>

                <button
                  class="qty-btn"
                  @click="increaseQty(item)"
                  :disabled="cart.isUpdating(item.id)"
                >
                  <span v-if="cart.isUpdating(item.id)"
                    class="spinner-border spinner-border-sm" style="width:8px;height:8px;border-width:1.5px;"></span>
                  <i v-else class="bi bi-plus" style="font-size:.7rem;"></i>
                </button>
              </div>
            </div>

            <div class="d-flex flex-column align-items-end gap-2">
              <!-- FIX: price × quantity -->
              <span class="cart-item-price">{{ formatPrice((item.price || 0) * (item.quantity || 1)) }}</span>
              <button class="btn btn-sm p-0 text-muted" @click="cart.removeItem(item.id)" style="line-height:1;">
                <i class="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Footer -->
      <div v-if="!cart.isEmpty" class="pt-3 border-top" style="border-color:var(--navy-border)!important;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="text-muted">Subtotal ({{ cart.totalItems }} items)</span>
          <span class="cart-total">{{ formatPrice(cart.totalPrice) }}</span>
        </div>
        <RouterLink class="btn btn-gold w-100 mb-2" to="/checkout" @click="cart.closeCart()">
          <i class="bi bi-lock me-2"></i>Proceed to Checkout
        </RouterLink>
        <RouterLink class="btn btn-outline-gold w-100" to="/cart" @click="cart.closeCart()">
          View Full Cart
        </RouterLink>
        <button class="btn btn-link text-danger w-100 mt-1 btn-sm" @click="cart.clearCart()">
          <i class="bi bi-trash me-1"></i>Clear Cart
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()

function formatPrice(val) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(val || 0)
}

async function increaseQty(item) {
  await cart.updateItem(item.id, (item.quantity || 1) + 1)
}

async function decreaseQty(item) {
  const qty = item.quantity || 1
  if (qty <= 1) {
    await cart.removeItem(item.id)
  } else {
    await cart.updateItem(item.id, qty - 1)
  }
}
</script>

<style scoped>
.offcanvas { width: 380px; }
@media (max-width: 480px) { .offcanvas { width: 100vw; } }
</style>

<template>
  <nav class="mobile-bottom-nav d-lg-none">
    <RouterLink to="/" class="nav-tab" :class="{ active: route.name === 'Home' }">
      <i class="bi bi-house"></i>
      <span>Home</span>
    </RouterLink>
    <RouterLink to="/products" class="nav-tab" :class="{ active: route.name === 'Products' || route.name === 'ProductDetail' }">
      <i class="bi bi-grid"></i>
      <span>Shop</span>
    </RouterLink>
    <RouterLink to="/search" class="nav-tab" :class="{ active: route.name === 'Search' }">
      <i class="bi bi-search"></i>
      <span>Search</span>
    </RouterLink>
    <RouterLink v-if="auth.isAuthenticated" to="/cart" class="nav-tab position-relative" :class="{ active: route.name === 'Cart' }">
      <i class="bi bi-bag"></i>
      <span class="badge-dot" v-if="cart.totalItems > 0">{{ cart.totalItems > 9 ? '9+' : cart.totalItems }}</span>
      <span>Cart</span>
    </RouterLink>
    <RouterLink v-if="auth.isAuthenticated" to="/wishlist" class="nav-tab position-relative" :class="{ active: route.name === 'Wishlist' }">
      <i class="bi bi-heart"></i>
      <span class="badge-dot" v-if="wishlist.count > 0"></span>
      <span>Saved</span>
    </RouterLink>
    <RouterLink v-if="auth.isAuthenticated" to="/profile" class="nav-tab position-relative" :class="{ active: route.name === 'Profile' }">
      <i class="bi bi-person"></i>
      <span class="badge-dot unread" v-if="notifications.hasUnread"></span>
      <span>Profile</span>
    </RouterLink>
    <RouterLink v-if="!auth.isAuthenticated" to="/login" class="nav-tab" :class="{ active: route.name === 'Login' }">
      <i class="bi bi-person"></i>
      <span>Sign In</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useNotificationStore } from '@/stores/notifications'

const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const notifications = useNotificationStore()
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: rgba(10, 22, 40, 0.97);
  border-top: 1px solid var(--navy-border);
  backdrop-filter: blur(12px);
  display: flex;
  z-index: 1040;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: .5rem .25rem;
  color: var(--text-muted);
  text-decoration: none;
  font-size: .62rem;
  font-weight: 500;
  transition: var(--transition);
  gap: 2px;
  position: relative;
}
.nav-tab i { font-size: 1.25rem; }
.nav-tab.active { color: var(--gold); }
.nav-tab:active { transform: scale(.92); }
.badge-dot {
  position: absolute;
  top: 4px;
  right: calc(50% - 14px);
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--gold);
  color: var(--navy);
  font-size: .52rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--navy-mid);
  padding: 0 2px;
}
.badge-dot:empty, .badge-dot.unread {
  min-width: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e74c3c;
  right: calc(50% - 10px);
  top: 5px;
  padding: 0;
}
</style>

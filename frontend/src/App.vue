<template>
  <div id="app-root">
    <AppNavbar v-if="!isAuthPage" />

    <main class="flex-grow-1" :style="{ paddingBottom: auth.isAuthenticated && !isAuthPage ? '70px' : '0' }" style="min-height:60vh;">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter v-if="!isAuthPage && !isMobileApp" />
    <MobileBottomNav v-if="!isAuthPage" />
    <CartSidebar />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useNotificationStore } from '@/stores/notifications'
import MockDevBar from '@/components/dev/MockDevBar.vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import CartSidebar from '@/components/layout/CartSidebar.vue'

const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const notifications = useNotificationStore()

const authPages = ['Login', 'Register', 'ForgotPassword', 'ResetPassword']
const isAuthPage = computed(() => authPages.includes(route.name))
const isVerifyPage = computed(() => route.name === 'VerifyEmail')
const isMobileApp = computed(() => window.innerWidth < 768 && route.name !== 'Home')

onMounted(async () => {
  if (auth.isAuthenticated) {
    await auth.fetchMe()
    await Promise.all([cart.fetchCart(), wishlist.fetchWishlist()])
    notifications.startPolling() // backend emits order/offer notifications — fetch + poll them
  }
})

// Start/stop notification polling when the user logs in/out.
watch(() => auth.isAuthenticated, (on) => {
  if (on) notifications.startPolling()
  else notifications.stopPolling()
})

onBeforeUnmount(() => {
  notifications.stopPolling()
})
</script>

<style scoped>
.verify-banner {
  background: linear-gradient(90deg, #b7791f, #c9a96e);
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 1050;
}
</style>

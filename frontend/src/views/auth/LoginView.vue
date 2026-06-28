<template>
  <div class="auth-page">
    <!-- Left decorative panel (desktop only) -->
    <div class="auth-panel d-none d-lg-flex align-items-center justify-content-center p-5">
      <div class="auth-panel-content text-center">
        <div class="big-text mb-3">تسليم</div>
        <h2 class="text-cream mb-3" style="font-size:1.6rem;">Welcome back to<br><span class="text-gold">Tasleem</span></h2>
        <p class="text-muted" style="max-width:300px;font-size:.9rem;line-height:1.7;">
          Your trusted marketplace for buying, selling and renting premium products across Egypt.
        </p>
        <div class="mt-5 d-flex flex-column gap-3" style="max-width:260px;margin:0 auto;text-align:left;">
          <div v-for="f in features" :key="f" class="d-flex align-items-center gap-3">
            <div class="flex-shrink-0 d-flex align-items-center justify-content-center"
              style="width:32px;height:32px;border-radius:50%;background:rgba(201,169,110,0.12);">
              <i class="bi bi-check2 text-gold" style="font-size:.85rem;"></i>
            </div>
            <span class="text-muted" style="font-size:.875rem;">{{ f }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel: form -->
    <div class="d-flex align-items-center justify-content-center p-4 p-lg-5"
      style="flex: 0 0 auto; width: 100%; max-width: 100%;" :style="{ maxWidth: 'min(100%, 520px)' }">

      <div class="auth-card w-100">
        <!-- Logo -->
        <div class="auth-logo">تسليم<span>.</span></div>
        <p class="text-muted mb-4" style="font-size:.875rem;margin-top:.25rem;">Sign in to your account</p>

        <!-- Lockout Warning -->
        <div v-if="isLockedOut" class="alert mb-3 py-2 px-3 d-flex align-items-center gap-2"
          style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);border-radius:.6rem;font-size:.85rem;color:#e74c3c;">
          <i class="bi bi-exclamation-circle-fill flex-shrink-0"></i>
          <span>Too many failed attempts. Please try again in <strong>{{ countdown }}</strong> seconds.</span>
        </div>

        <!-- Standard Error -->
        <div v-else-if="errorMsg" class="alert mb-3 py-2 px-3 d-flex align-items-center gap-2"
          style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);border-radius:.6rem;font-size:.85rem;color:#e74c3c;">
          <i class="bi bi-exclamation-circle-fill flex-shrink-0"></i>
          <span>{{ errorMsg }}</span>
        </div>

        <form @submit.prevent="onSubmit" novalidate>
          <!-- Email -->
          <div class="mb-3">
            <label class="form-label">Email Address</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-envelope"></i></span>
              <input
                v-model="form.email"
                type="email"
                class="form-control"
                :class="{ 'is-invalid': errors.email }"
                placeholder="you@example.com"
                autocomplete="email"
                :disabled="isLockedOut"
              />
              <div class="invalid-feedback">{{ errors.email }}</div>
            </div>
          </div>

          <!-- Password -->
          <div class="mb-4">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <label class="form-label mb-0">Password</label>
              <RouterLink to="/forgot-password" class="text-gold text-decoration-none" style="font-size:.82rem;">Forgot password?</RouterLink>
            </div>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-lock"></i></span>
              <input
                v-model="form.password"
                :type="showPw ? 'text' : 'password'"
                class="form-control"
                :class="{ 'is-invalid': errors.password }"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="isLockedOut"
              />
              <button type="button" class="input-group-text" style="cursor:pointer;" @click="showPw = !showPw" :disabled="isLockedOut">
                <i :class="showPw ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">{{ errors.password }}</div>
            </div>
          </div>

          <button type="submit" class="btn btn-gold w-100 py-2" :disabled="isLockedOut || auth.loading">
            <span class="spinner-border spinner-border-sm me-2" v-if="auth.loading"></span>
            {{ auth.loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="or-divider">or</div>
        <p class="text-center mb-0 text-muted" style="font-size:.9rem;">
          Don't have an account?
          <RouterLink class="text-gold text-decoration-none fw-500" to="/register">Create one</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useToast } from 'vue-toastification'
import { useAuthLockout } from '@/composables/useAuthLockout' // <-- Added Lockout

const router   = useRouter()
const route    = useRoute()
const auth     = useAuthStore()
const cart     = useCartStore()
const wishlist = useWishlistStore()
const toast    = useToast()

// Initialize lockout (5 attempts → 60 seconds, matching the Flutter app)
const { isLockedOut, countdown, recordFailure, recordSuccess } = useAuthLockout(5, 60)

const form    = reactive({ email: '', password: '' })
const errors  = reactive({ email: '', password: '' })
const errorMsg = ref('')
const showPw   = ref(false)

const features = [
  'AI-powered product recommendations',
  'Secure & encrypted payments',
  'Buy, sell and rent in one place',
  'Real-time order tracking',
]

function validate() {
  errors.email = ''
  errors.password = ''
  let valid = true
  if (!form.email) { errors.email = 'Email is required'; valid = false }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Enter a valid email'; valid = false }
  if (!form.password) { errors.password = 'Password is required'; valid = false }
  else if (form.password.length < 6) { errors.password = 'Password must be at least 6 characters'; valid = false }
  return valid
}

async function onSubmit() {
  if (isLockedOut.value) return // Prevent submission if locked out
  
  errorMsg.value = ''
  if (!validate()) return

  const res = await auth.login(form)
  if (res.success) {
    recordSuccess() // Reset attempts on successful login
    toast.success('Welcome back!')
    await Promise.all([cart.fetchCart(), wishlist.fetchWishlist()])
    router.push(route.query.redirect || '/')
  } else {
    recordFailure() // Increment attempts on failed login
    errorMsg.value = res.message
  }
}
</script>
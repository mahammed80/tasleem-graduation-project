<template>
  <div class="auth-page">
    <div class="auth-panel flex-grow-1 d-none d-lg-flex align-items-center justify-content-center p-5">
      <div class="auth-panel-content text-center">
        <div class="big-text mb-4">تسليم</div>
        <h2 class="text-cream mb-3">Reset your<br /><span class="text-gold">Password</span></h2>
        <p class="text-muted" style="max-width:300px;">We'll send a secure one-time link to your inbox.</p>
      </div>
    </div>
    <div class="d-flex align-items-center justify-content-center p-4 p-md-5" style="min-width:min(100%,480px);">
      <div class="auth-card">
        <div class="auth-logo mb-1">تسليم<span>.</span></div>
        <div v-if="sent" class="text-center py-3">
          <div class="mx-auto mb-4" style="width:72px;height:72px;border-radius:50%;background:rgba(46,204,113,.12);display:flex;align-items:center;justify-content:center;">
            <i class="bi bi-envelope-check" style="font-size:2rem;color:#2ecc71;"></i>
          </div>
          <h5 class="text-cream mb-2">Check your inbox</h5>
          <p class="text-muted mb-4" style="font-size:.9rem;">We sent a reset link to <strong class="text-gold">{{ form.email }}</strong>. Also check your spam folder.</p>
          <RouterLink class="btn btn-outline-gold w-100 mb-2" to="/login">Back to Sign In</RouterLink>
          <button class="btn btn-link text-muted w-100 btn-sm" @click="sent=false;form.email=''">Try a different email</button>
        </div>
        <div v-else>
          <p class="text-muted mb-4" style="font-size:.9rem;">Enter the email linked to your account and we'll send a reset link.</p>
          <div class="alert alert-danger py-2 px-3 mb-3" style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);border-radius:.6rem;font-size:.88rem;" v-if="errorMsg">
            <i class="bi bi-exclamation-circle me-2"></i>{{ errorMsg }}
          </div>
          <form @submit.prevent="onSubmit" novalidate>
            <div class="mb-4">
              <label class="form-label">Email Address</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                <input v-model="form.email" type="email" class="form-control" :class="{'is-invalid':errors.email}" placeholder="you@example.com" autocomplete="email" />
                <div class="invalid-feedback">{{ errors.email }}</div>
              </div>
            </div>
            <button type="submit" class="btn btn-gold w-100 py-2" :disabled="auth.loading">
              <span class="spinner-border spinner-border-sm me-2" v-if="auth.loading"></span>
              {{ auth.loading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </form>
          <div class="or-divider my-4">or</div>
          <RouterLink class="btn btn-outline-gold w-100" to="/login">Back to Sign In</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const sent = ref(false)
const errorMsg = ref('')
const form = reactive({ email: '' })
const errors = reactive({ email: '' })
function validate() {
  errors.email = ''
  if (!form.email) { errors.email = 'Email is required'; return false }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Enter a valid email'; return false }
  return true
}
async function onSubmit() {
  errorMsg.value = ''
  if (!validate()) return
  const res = await auth.forgotPassword(form.email)
  if (res.success) sent.value = true
  else errorMsg.value = res.message
}
</script>

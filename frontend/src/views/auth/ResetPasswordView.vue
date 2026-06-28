<template>
  <div class="auth-page">
    <div class="auth-panel flex-grow-1 d-none d-lg-flex align-items-center justify-content-center p-5">
      <div class="auth-panel-content text-center">
        <div class="big-text mb-4">تسليم</div>
        <h2 class="text-cream mb-3">Create a new<br /><span class="text-gold">Password</span></h2>
        <p class="text-muted" style="max-width:300px;">Choose a strong password you haven't used before.</p>
      </div>
    </div>
    <div class="d-flex align-items-center justify-content-center p-4 p-md-5" style="min-width:min(100%,480px);">
      <div class="auth-card">
        <div class="auth-logo mb-1">تسليم<span>.</span></div>
        <div v-if="done" class="text-center py-3">
          <div class="mx-auto mb-4" style="width:72px;height:72px;border-radius:50%;background:rgba(46,204,113,.12);display:flex;align-items:center;justify-content:center;">
            <i class="bi bi-check-circle" style="font-size:2rem;color:#2ecc71;"></i>
          </div>
          <h5 class="text-cream mb-2">Password updated!</h5>
          <p class="text-muted mb-4" style="font-size:.9rem;">Your password has been changed successfully. You can now sign in.</p>
          <RouterLink class="btn btn-gold w-100" to="/login">Sign In</RouterLink>
        </div>
        <div v-else>
          <p class="text-muted mb-4" style="font-size:.9rem;">Enter your new password below.</p>
          <div class="alert alert-danger py-2 px-3 mb-3" style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);border-radius:.6rem;font-size:.88rem;" v-if="errorMsg">
            <i class="bi bi-exclamation-circle me-2"></i>{{ errorMsg }}
          </div>
          <form @submit.prevent="onSubmit" novalidate>
            <div class="mb-3">
              <label class="form-label">Email Address</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                <input v-model="form.email" type="email" class="form-control" :class="{'is-invalid':errors.email}" placeholder="you@example.com" />
                <div class="invalid-feedback">{{ errors.email }}</div>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">New Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                <input v-model="form.password" :type="showPw?'text':'password'" class="form-control" :class="{'is-invalid':errors.password}" placeholder="Min. 8 characters" autocomplete="new-password" />
                <button type="button" class="input-group-text cursor-pointer" @click="showPw=!showPw">
                  <i :class="showPw?'bi bi-eye-slash':'bi bi-eye'"></i>
                </button>
                <div class="invalid-feedback">{{ errors.password }}</div>
              </div>
              <div class="mt-2 d-flex gap-1" v-if="form.password">
                <div v-for="n in 4" :key="n" class="flex-grow-1" style="height:3px;border-radius:2px;transition:.2s;" :style="{background: n<=strength ? colors[strength-1] : 'var(--navy-border)'}"></div>
              </div>
            </div>
            <div class="mb-4">
              <label class="form-label">Confirm New Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-lock-fill"></i></span>
                <input v-model="form.password_confirmation" :type="showPw?'text':'password'" class="form-control" :class="{'is-invalid':errors.password_confirmation}" placeholder="Repeat password" autocomplete="new-password" />
                <div class="invalid-feedback">{{ errors.password_confirmation }}</div>
              </div>
            </div>
            <button type="submit" class="btn btn-gold w-100 py-2" :disabled="auth.loading">
              <span class="spinner-border spinner-border-sm me-2" v-if="auth.loading"></span>
              {{ auth.loading ? 'Updating...' : 'Update Password' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const route = useRoute()
const auth = useAuthStore()
const done = ref(false)
const showPw = ref(false)
const errorMsg = ref('')
const form = reactive({ email: '', password: '', password_confirmation: '', token: '' })
const errors = reactive({ email: '', password: '', password_confirmation: '' })
const colors = ['#e74c3c','#f39c12','#3498db','#2ecc71']
const strength = computed(() => {
  const p = form.password
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return Math.max(s, 1)
})
onMounted(() => {
  form.token = route.query.token || ''
  form.email = route.query.email || ''
})
function validate() {
  Object.keys(errors).forEach(k => errors[k] = '')
  let valid = true
  if (!form.email) { errors.email = 'Required'; valid = false }
  if (!form.password) { errors.password = 'Required'; valid = false }
  else if (form.password.length < 8) { errors.password = 'Min 8 characters'; valid = false }
  if (form.password !== form.password_confirmation) { errors.password_confirmation = 'Passwords do not match'; valid = false }
  return valid
}
async function onSubmit() {
  errorMsg.value = ''
  if (!validate()) return
  const res = await auth.resetPassword(form)
  if (res.success) done.value = true
  else {
    errorMsg.value = res.message
    if (res.errors) Object.assign(errors, Object.fromEntries(Object.entries(res.errors).map(([k,v]) => [k, Array.isArray(v)?v[0]:v])))
  }
}
</script>

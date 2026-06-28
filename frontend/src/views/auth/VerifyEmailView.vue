<template>
  <div class="d-flex align-items-center justify-content-center" style="min-height:100vh;background:linear-gradient(135deg,#06101e,#0d1b2e);">
    <div class="card p-5 text-center" style="max-width:460px;width:100%;border-radius:1.25rem;">
      <div class="mx-auto mb-4" style="width:80px;height:80px;border-radius:50%;background:rgba(201,169,110,.1);display:flex;align-items:center;justify-content:center;border:2px solid rgba(201,169,110,.25);">
        <i class="bi bi-envelope-exclamation text-gold" style="font-size:2.2rem;"></i>
      </div>
      <h4 class="text-cream mb-2">Verify your email</h4>
      <p class="text-muted mb-1" style="font-size:.9rem;">We sent a verification link to</p>
      <p class="text-gold fw-600 mb-4">{{ auth.user?.email }}</p>
      <p class="text-muted mb-4" style="font-size:.85rem;">Click the link in your email to activate your account. If you don't see it, check your spam folder.</p>

      <div class="alert py-2 px-3 mb-3" style="background:rgba(46,204,113,.1);border:1px solid rgba(46,204,113,.25);border-radius:.6rem;font-size:.85rem;" v-if="resentOk">
        <i class="bi bi-check-circle me-2"></i>Verification email resent!
      </div>
      <div class="alert py-2 px-3 mb-3" style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);border-radius:.6rem;font-size:.85rem;" v-if="errorMsg">
        <i class="bi bi-exclamation-circle me-2"></i>{{ errorMsg }}
      </div>

      <button class="btn btn-gold w-100 mb-2" @click="resend" :disabled="auth.loading || cooldown > 0">
        <span class="spinner-border spinner-border-sm me-2" v-if="auth.loading"></span>
        {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email' }}
      </button>
      <button class="btn btn-outline-gold w-100" @click="checkVerification">
        I've verified my email
      </button>
      <hr style="border-color:var(--navy-border);margin:1.5rem 0;" />
      <button class="btn btn-link text-muted btn-sm" @click="logout">Sign out and use a different account</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const resentOk = ref(false)
const errorMsg = ref('')
const cooldown = ref(0)
let timer = null

async function resend() {
  resentOk.value = false
  errorMsg.value = ''
  try {
    const res = await auth.resendVerification()
    if (res.success) {
      resentOk.value = true
      cooldown.value = 60
      timer = setInterval(() => {
        if (--cooldown.value <= 0) clearInterval(timer)
      }, 1000)
    } else {
      errorMsg.value = res.message || 'Could not send verification email. Please try again later.'
    }
  } catch (_) {
    errorMsg.value = 'Could not send verification email. Please try again later.'
  }
}

async function checkVerification() {
  errorMsg.value = ''
  await auth.fetchMe()
  if (!auth.needsVerification) {
    router.push(route.query.redirect || '/')
  } else {
    errorMsg.value = 'Email not verified yet. Please click the link in your inbox.'
  }
}

async function logout() {
  await auth.logout()
  router.push('/login')
}

onMounted(() => {
  if (!auth.needsVerification) {
    router.push('/')
  }
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>
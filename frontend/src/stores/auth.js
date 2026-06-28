import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/api'

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return JSON.parse(raw)
  } catch (_) {
    localStorage.removeItem(key)
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(safeRead('tasleem_user'))
  const token   = ref(localStorage.getItem('tasleem_token') || null)
  const loading = ref(false)

  const isAuthenticated   = computed(() => !!token.value)
  const isAdmin           = computed(() => user.value?.role === 'admin')
  // This is a C2C marketplace — every signed-in user can sell.
  const isSeller          = computed(() => isAuthenticated.value)
  const needsVerification = computed(() => isAuthenticated.value && !user.value?.email_verified_at)
  const fullName          = computed(() => user.value?.name || '')
  const emailVerified     = computed(() => !!user.value?.email_verified_at)

  function setAuth(userData, tokenData) {
    user.value  = userData
    token.value = tokenData
    localStorage.setItem('tasleem_user',  JSON.stringify(userData))
    localStorage.setItem('tasleem_token', tokenData)
  }

  function clearAuth() {
    user.value  = null
    token.value = null
    localStorage.removeItem('tasleem_user')
    localStorage.removeItem('tasleem_token')
  }

  function extractAuth(responseData) {
    const d = responseData?.data || responseData
    return {
      userData:  d?.user  || responseData?.user,
      tokenData: d?.token || responseData?.token,
    }
  }

  async function login(credentials) {
    loading.value = true
    try {
      const res = await authService.login(credentials)
      const { userData, tokenData } = extractAuth(res.data)
      if (!userData || !tokenData) throw new Error('Invalid response from server')
      setAuth(userData, tokenData)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed', errors: err.response?.data?.errors || {} }
    } finally {
      loading.value = false
    }
  }

  async function register(data) {
    loading.value = true
    try {
      const res = await authService.register(data)
      const { userData, tokenData } = extractAuth(res.data)
      if (!userData || !tokenData) throw new Error('Invalid response from server')
      setAuth(userData, tokenData)
      // The backend register() only stores name/email/password/phone/national_id,
      // so persist city/address via the (working) profile update — same approach
      // the Flutter app uses. Non-fatal: the account is already created.
      if (data.city || data.address) {
        try {
          const { userService } = await import('@/services/api')
          const r = await userService.update(userData.id, {
            name: data.name, phone: data.phone, city: data.city, address: data.address,
          })
          const updated = r.data?.user || r.data?.data || r.data
          if (updated?.id) { user.value = updated; localStorage.setItem('tasleem_user', JSON.stringify(updated)) }
        } catch (_) { /* keep going — register succeeded */ }
      }
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed', errors: err.response?.data?.errors || {} }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try { await authService.logout() } catch (_) {}
    clearAuth()
  }

  async function fetchMe() {
    try {
      const res  = await authService.me()
      const userData = res.data?.user || res.data?.data || res.data
      if (userData && userData.id) {
        user.value = userData
        localStorage.setItem('tasleem_user', JSON.stringify(userData))
      }
    } catch (err) {
      // Only log out if the token is genuinely rejected. A network error,
      // timeout, or 5xx (e.g. the backend cold-starting) must NOT wipe the
      // session — keep the cached user/token from localStorage so a refresh
      // doesn't sign the user out.
      const status = err?.response?.status
      if (status === 401 || status === 403) clearAuth()
    }
  }

  async function updateProfile(data) {
    loading.value = true
    try {
      const { userService } = await import('@/services/api')
      const res = await userService.update(user.value.id, data)
      const userData = res.data?.user || res.data?.data || res.data
      user.value = userData
      localStorage.setItem('tasleem_user', JSON.stringify(userData))
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' }
    } finally {
      loading.value = false
    }
  }

  // ── Email features — now real API calls ───────────────────────────

  async function forgotPassword(email) {
    loading.value = true
    try {
      await authService.forgotPassword({ email })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to send reset link' }
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(data) {
    loading.value = true
    try {
      const res = await authService.resetPassword(data)
      const { userData, tokenData } = extractAuth(res.data)
      if (userData && tokenData) setAuth(userData, tokenData)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Password reset failed', errors: err.response?.data?.errors || {} }
    } finally {
      loading.value = false
    }
  }

  async function resendVerification() {
    loading.value = true
    try {
      await authService.resendVerification()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to resend email' }
    } finally {
      loading.value = false
    }
  }

  return {
    user, token, loading,
    isAuthenticated, isAdmin, isSeller, fullName, emailVerified, needsVerification,
    login, register, logout, fetchMe, updateProfile,
    forgotPassword, resetPassword, resendVerification,
  }
})

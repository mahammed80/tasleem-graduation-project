<template>
  <div class="auth-page">
    <!-- Left decorative panel -->
    <div class="auth-panel d-none d-lg-flex align-items-center justify-content-center p-5">
      <div class="auth-panel-content text-center">
        <div class="big-text mb-3">تسليم</div>
        <h2 class="text-cream mb-3" style="font-size:1.6rem;">Join <span class="text-gold">Tasleem</span><br>Today</h2>
        <p class="text-muted mb-4" style="max-width:280px;font-size:.9rem;line-height:1.7;">
          Start buying, selling and renting in minutes. No listing fees to get started.
        </p>
        <div class="card p-4 text-start" style="max-width:260px;margin: 0 auto;border-radius:1rem;">
          <div class="text-gold fw-700 mb-1" style="font-size:1.2rem;">FREE</div>
          <div class="text-cream mb-3" style="font-size:.875rem;">to join & start selling</div>
          <div v-for="f in perks" :key="f" class="d-flex align-items-center gap-2 text-muted" style="font-size:.85rem;">
            <i class="bi bi-check-circle-fill text-gold flex-shrink-0" style="font-size:.8rem;"></i>{{ f }}
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel: form -->
    <div class="d-flex align-items-center justify-content-center p-4 p-lg-5"
      style="flex: 0 0 auto; width: 100%; overflow-y: auto;" :style="{ maxWidth: 'min(100%, 560px)' }">

      <div class="auth-card w-100" style="max-width:480px;">
        <div class="auth-logo">تسليم<span>.</span></div>
        <p class="text-muted mb-4" style="font-size:.875rem;margin-top:.25rem;">Create your account</p>

        <!-- Lockout Warning -->
        <div v-if="isLockedOut" class="alert mb-3 py-2 px-3 d-flex align-items-center gap-2"
          style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);border-radius:.6rem;font-size:.85rem;color:#e74c3c;">
          <i class="bi bi-exclamation-circle-fill flex-shrink-0"></i>
          <span>Too many failed attempts. Please try again in <strong>{{ countdown }}</strong> seconds.</span>
        </div>

        <!-- Standard Error -->
        <div v-else-if="errorMessage" class="alert mb-3 py-2 px-3 d-flex align-items-center gap-2"
          style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.25);border-radius:.6rem;font-size:.85rem;color:#e74c3c;">
          <i class="bi bi-exclamation-circle-fill flex-shrink-0"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="onSubmit" novalidate>
          <!-- Full Name -->
          <div class="mb-3">
            <label class="form-label">Full Name</label>
            <div class="input-group">
              <span class="input-group-text text-muted">👤</span>
              <input v-model="form.name" type="text" class="form-control" :class="{ 'is-invalid': errors.name }"
                placeholder="Ahmed Mohamed" autocomplete="name" :disabled="isLockedOut" />
              <div class="invalid-feedback">{{ errors.name }}</div>
            </div>
          </div>

          <!-- Email -->
          <div class="mb-3">
            <label class="form-label">Email Address</label>
            <div class="input-group">
              <span class="input-group-text text-muted">📧</span>
              <input v-model="form.email" type="email" class="form-control" :class="{ 'is-invalid': errors.email }"
                placeholder="you@example.com" autocomplete="email" :disabled="isLockedOut" />
              <div class="invalid-feedback">{{ errors.email }}</div>
            </div>
          </div>

          <!-- Phone + Country Code -->
          <div class="mb-3">
            <label class="form-label">Phone Number</label>
            <div class="input-group" :class="{ 'is-invalid': errors.phone }">
              <button type="button" class="btn country-code-btn dropdown-toggle d-flex align-items-center justify-content-center gap-1"
                data-bs-toggle="dropdown" aria-expanded="false" 
                style="background:var(--navy-light);border:1px solid var(--navy-border);border-radius:.5rem 0 0 .5rem;padding:.5rem .7rem;color:var(--text-main);font-size:.88rem;white-space:nowrap;"
                :disabled="isLockedOut">
                {{ selectedCountry.flag }} {{ selectedCountry.code }}
              </button>
              <ul class="dropdown-menu country-dropdown" style="min-width:260px;max-height:280px;overflow-y:auto;">
                <li v-for="c in countryCodes" :key="c.code">
                  <button type="button" class="dropdown-item d-flex align-items-center justify-content-center gap-2"
                    :class="{ active: selectedCountry.code === c.code }"
                    @click="selectedCountry = c">
                    <span style="font-size:1.1rem;">{{ c.flag }}</span>
                    <span class="flex-grow-1"> {{ c.name }}</span>
                    <span class="text-gold" style="font-size:.82rem;">{{ c.code }}</span>
                  </button>
                </li>
              </ul>
              <input v-model="form.phone" type="tel" class="form-control" :class="{ 'is-invalid': errors.phone }"
                placeholder="10-digit number" autocomplete="tel" inputmode="numeric" maxlength="10"
                @input="form.phone = form.phone.replace(/\D/g, '').slice(0, 10)" :disabled="isLockedOut" />
            </div>
            <div class="text-danger mt-1" v-if="errors.phone">{{ errors.phone }}</div>
          </div>

          <!-- National ID -->
          <div class="mb-3">
            <label class="form-label">National ID</label>
            <div class="input-group">
              <span class="input-group-text text-muted">🪪</span>
              <input v-model="form.national_id" type="text" class="form-control" :class="{ 'is-invalid': errors.national_id }"
                placeholder="14-digit national ID" inputmode="numeric" maxlength="14"
                @input="form.national_id = form.national_id.replace(/\D/g, '').slice(0, 14)" :disabled="isLockedOut" />
              <div class="invalid-feedback">{{ errors.national_id }}</div>
            </div>
            <div class="text-muted mt-1" style="font-size:.73rem;">This can't be changed later.</div>
          </div>

          <!-- City -->
          <div class="mb-3">
            <label class="form-label">City</label>
            <div class="input-group">
              <span class="input-group-text text-muted">🏙️</span>
              <select v-model="form.city" class="form-select" :class="{ 'is-invalid': errors.city }" :disabled="isLockedOut">
                <option value="">Select your city</option>
                <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
              </select>
              <div class="invalid-feedback">{{ errors.city }}</div>
            </div>
          </div>

          <!-- Address -->
          <div class="mb-3">
            <label class="form-label">Address</label>
            <div class="input-group">
              <span class="input-group-text text-muted">📍</span>
              <input v-model="form.address" type="text" class="form-control" :class="{ 'is-invalid': errors.address }"
                placeholder="Street, building, area" autocomplete="street-address" :disabled="isLockedOut" />
              <div class="invalid-feedback">{{ errors.address }}</div>
            </div>
          </div>

          <!-- Password -->
          <div class="mb-3">
            <label class="form-label">Password</label>
            <div class="input-group">
              <span class="input-group-text text-muted">🔒</span>
              <input v-model="form.password" :type="showPw ? 'text' : 'password'" class="form-control"
                :class="{ 'is-invalid': errors.password }" placeholder="Min. 8 characters"
                autocomplete="new-password" :disabled="isLockedOut" />
              <button type="button" class="input-group-text text-muted" style="cursor:pointer;" @click="showPw = !showPw" :disabled="isLockedOut">
                <i :class="showPw ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">{{ errors.password }}</div>
            </div>
            <!-- Strength meter -->
            <div class="d-flex gap-1 mt-2" v-if="form.password">
              <div v-for="n in 4" :key="n" style="flex:1;height:3px;border-radius:2px;transition:.2s;"
                :style="{ background: n <= passwordStrength ? strengthColors[passwordStrength - 1] : 'var(--navy-border)' }">
              </div>
            </div>
            <div class="text-muted mt-1" style="font-size:.73rem;" v-if="form.password">
              {{ strengthLabels[passwordStrength - 1] || '' }}
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="mb-4">
            <label class="form-label">Confirm Password</label>
            <div class="input-group">
              <span class="input-group-text text-muted">🔒</span>
              <input v-model="form.password_confirmation" :type="showPw ? 'text' : 'password'" class="form-control"
                :class="{ 'is-invalid': errors.password_confirmation }" placeholder="Repeat password"
                autocomplete="new-password" :disabled="isLockedOut" />
              <div class="invalid-feedback">{{ errors.password_confirmation }}</div>
            </div>
          </div>

          <!-- Terms -->
          <div class="mb-4">
            <input class="form-check-input" type="checkbox" v-model="form.terms" id="terms"
              :class="{ 'is-invalid': errors.terms }" :disabled="isLockedOut" />
            <label class="form-check-label text-muted" for="terms" style="font-size:.85rem;">
              I agree to the <a href="#" class="text-gold">Terms of Service</a> and
              <a href="#" class="text-gold">Privacy Policy</a>
            </label>
            <div class="invalid-feedback">{{ errors.terms }}</div>
          </div>

          <button type="submit" class="btn btn-gold w-100 py-2" :disabled="isLockedOut || auth.loading">
            <span class="spinner-border spinner-border-sm me-2" v-if="auth.loading"></span>
            {{ auth.loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <div class="or-divider">or</div>
        <p class="text-center mb-0 text-muted" style="font-size:.9rem;">
          Already have an account?
          <RouterLink class="text-gold text-decoration-none fw-500" to="/login">Sign in</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth' // Fixed alias to match standard Vite config
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useToast } from 'vue-toastification'
import { useAuthLockout } from '@/composables/useAuthLockout' // <-- Added Lockout

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToast()

// Initialize lockout (3 attempts, 60 seconds)
const { isLockedOut, countdown, recordFailure, recordSuccess } = useAuthLockout(3, 60)

const showPw = ref(false)
const errorMessage = ref('')

const countryCodes = [
  { code: '+20',  name: 'Egypt',         flag: '🇪🇬' },
  { code: '+966', name: 'Saudi Arabia',  flag: '🇸🇦' },
  { code: '+971', name: 'UAE',           flag: '🇦🇪' },
  { code: '+974', name: 'Qatar',         flag: '🇶🇦' },
  { code: '+965', name: 'Kuwait',        flag: '🇰🇼' },
  { code: '+973', name: 'Bahrain',       flag: '🇧🇭' },
  { code: '+968', name: 'Oman',          flag: '🇴🇲' },
  { code: '+962', name: 'Jordan',        flag: '🇯🇴' },
  { code: '+961', name: 'Lebanon',       flag: '🇱🇧' },
  { code: '+44',  name: 'UK',            flag: '🇬🇧' },
  { code: '+1',   name: 'USA / Canada',  flag: '🇺🇸' },
  { code: '+49',  name: 'Germany',       flag: '🇩🇪' },
  { code: '+33',  name: 'France',        flag: '🇫🇷' },
]

const selectedCountry = ref(countryCodes[0]) // default Egypt +20

const form = reactive({
  name:                     '',
  email:                    '',
  phone:                    '',
  national_id:              '',
  city:                     '',
  address:                  '',
  password:                 '',
  password_confirmation:    '',
  terms:                    false,
})

const errors = reactive({
  name:                     '',
  email:                    '',
  phone:                    '',
  national_id:              '',
  city:                     '',
  address:                  '',
  password:                 '',
  password_confirmation:    '',
  terms:                    '',
})

const cities = ['Cairo', 'Giza', 'Alexandria', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El-Sheikh', 'Mansoura', 'Tanta', 'Zagazig', 'Port Said', 'Suez', 'Ismailia', 'Damietta', 'Asyut', 'Fayoum', 'Minya', 'Beni Suef', 'Qena', 'Sohag']

const perks = [
  'Free to list products',
  'AI-powered recommendations',
  'Secure payment handling',
  'Earn rental income',
]

const strengthColors = ['#e74c3c', '#f39c12', '#3498db', '#2ecc71']
const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']

const passwordStrength = computed(() => {
  const p = form.password 
  if (!p) return 0
  let s = 0
  if (p.length >= 8)           s++
  if (/[A-Z]/.test(p))         s++
  if (/[0-9]/.test(p))         s++
  if (/[^A-Za-z0-9]/.test(p))  s++
  return Math.max(s, 1)
})

function validate() {
  Object.keys(errors).forEach(k => errors[k] = '')
  let valid = true

  if (!form.name.trim())       { errors.name = 'Full name is required'; valid = false }

  if (!form.email)             { errors.email = 'Email is required'; valid = false }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Enter a full email'; valid = false }

  if (!form.phone)             { errors.phone = 'Phone number is required'; valid = false }
  else if (!/^\d{10}$/.test(form.phone)) { errors.phone = 'Phone must be exactly 10 digits'; valid = false }

  if (!form.national_id)       { errors.national_id = 'National ID is required'; valid = false }
  else if (!/^\d{14}$/.test(form.national_id)) { errors.national_id = 'National ID must be exactly 14 digits'; valid = false }

  if (!form.city)              { errors.city = 'City is required'; valid = false }

  if (!form.address.trim())    { errors.address = 'Address is required'; valid = false }

  if (!form.password)          { errors.password = 'Password is required'; valid = false }
  else if (form.password.length < 8) { errors.password = 'Minimum 8 characters'; valid = false }

  if (form.password !== form.password_confirmation) { errors.password_confirmation = 'Passwords do not match'; valid = false }

  if (!form.terms)             { errors.terms = 'You must accept the terms'; valid = false }

  return valid
}

async function onSubmit() {
  if (isLockedOut.value) return // Prevent submission if locked out
  
  errorMessage.value = ''
  if (!validate()) return

  const { terms, ...rest } = form
  const payload = {
    ...rest,
    phone: `${selectedCountry.value.code}${form.phone}`,
  }

  const res = await auth.register(payload)
  if (res.success) {
    recordSuccess() // Reset attempts on successful registration
    toast.success('Account created! Welcome to Tasleem 😊')
    await Promise.all([cart.fetchCart(), wishlist.fetchWishlist()])
    router.push('/')
  } else {
    recordFailure() // Increment attempts on failed registration
    errorMessage.value = res.message
    if (res.errors) {
      Object.assign(errors,
        Object.fromEntries(Object.entries(res.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
    }
  }
}
</script>
<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-credit-card me-2 text-gold"></i>Checkout</h1>
      </div>
    </div>

    <div class="container py-4">
      <!-- Step indicator -->
      <div class="step-indicator mb-5 px-2">
        <div class="step" :class="{ done: step > 1, active: step === 1 }">
          <i class="bi bi-check2" v-if="step > 1"></i>
          <span v-else>1</span>
        </div>
        <div class="step-line" :class="{ done: step > 1 }"></div>
        <div class="step" :class="{ done: step > 2, active: step === 2 }">
          <i class="bi bi-check2" v-if="step > 2"></i>
          <span v-else>2</span>
        </div>
        <div class="step-line" :class="{ done: step > 2 }"></div>
        <div class="step" :class="{ done: step > 3, active: step === 3 }">
          <i class="bi bi-check2" v-if="step > 3"></i>
          <span v-else>3</span>
        </div>
        <div class="ms-2 text-muted" style="font-size:.8rem; white-space:nowrap;">{{ stepLabels[step - 1] }}</div>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <!-- Step 1: Shipping -->
          <div v-if="step === 1">
            <div class="card p-4">
              <h5 class="text-cream mb-4"><i class="bi bi-truck me-2 text-gold"></i>Shipping Details</h5>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Full Name</label>
                  <input class="form-control" v-model="shipping.name" :class="{ 'is-invalid': shippingErrors.name }" placeholder="Ahmed Mohamed" />
                  <div class="invalid-feedback">{{ shippingErrors.name }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input class="form-control" type="email" v-model="shipping.email" :class="{ 'is-invalid': shippingErrors.email }" placeholder="you@example.com" />
                  <div class="invalid-feedback">{{ shippingErrors.email }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone</label>
                  <input class="form-control" type="tel" v-model="shipping.phone" :class="{ 'is-invalid': shippingErrors.phone }" placeholder="01234567890" />
                  <div class="invalid-feedback">{{ shippingErrors.phone }}</div>
                </div>
                <div class="col-12">
                  <label class="form-label">Address</label>
                  <input class="form-control" v-model="shipping.address" :class="{ 'is-invalid': shippingErrors.address }" placeholder="Street name and number" />
                  <div class="invalid-feedback">{{ shippingErrors.address }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">City</label>
                  <select class="form-select" v-model="shipping.city" :class="{ 'is-invalid': shippingErrors.city }">
                    <option value="">Select city</option>
                    <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <div class="invalid-feedback">{{ shippingErrors.city }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Postal Code</label>
                  <input class="form-control" v-model="shipping.postal_code" placeholder="12345" />
                </div>
              </div>
              <button class="btn btn-gold mt-4 px-4" @click="nextStep">
                Continue to Payment <i class="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>

          <!-- Step 2: Payment -->
          <div v-if="step === 2">
            <div class="card p-4">
              <h5 class="text-cream mb-4"><i class="bi bi-credit-card me-2 text-gold"></i>Payment Method</h5>

              <!-- Payment methods -->
              <div class="d-flex flex-column gap-2 mb-4">
                <label v-for="method in paymentMethods" :key="method.value" class="cursor-pointer">
                  <input type="radio" class="d-none" v-model="payment.method" :value="method.value" />
                  <div class="card p-3 d-flex flex-row align-items-center gap-3"
                    :style="{ borderColor: payment.method === method.value ? 'var(--gold)' : '', background: payment.method === method.value ? 'rgba(201,169,110,.07)' : '' }">
                    <i :class="method.icon + ' fs-4 text-gold'"></i>
                    <div>
                      <div class="text-cream fw-600">{{ method.label }}</div>
                      <div class="text-muted" style="font-size:.8rem;">{{ method.desc }}</div>
                    </div>
                    <i class="bi bi-check-circle-fill text-gold ms-auto" v-if="payment.method === method.value"></i>
                  </div>
                </label>
              </div>

              <!-- Card form -->
              <div v-if="payment.method === 'card'" class="card p-3 mb-3" style="background:var(--navy-light);">
                <div class="mb-3">
                  <label class="form-label">Card Number</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-credit-card"></i></span>
                    <input class="form-control" v-model="payment.card_number" placeholder="1234 5678 9012 3456" maxlength="19" @input="formatCardNumber" />
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label">Expiry</label>
                    <input class="form-control" v-model="payment.expiry" placeholder="MM/YY" maxlength="5" @input="formatExpiry" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">CVV</label>
                    <input class="form-control" v-model="payment.cvv" placeholder="•••" maxlength="3" type="password" />
                  </div>
                </div>
                <div class="mt-3 d-flex align-items-center gap-2 text-muted" style="font-size:.78rem;">
                  <i class="bi bi-shield-lock text-gold"></i>
                  Your payment information is encrypted and secure.
                </div>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-outline-gold px-4" @click="step = 1">
                  <i class="bi bi-arrow-left me-2"></i>Back
                </button>
                <button class="btn btn-gold px-4" @click="nextStep">
                  Review Order <i class="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Step 3: Confirm -->
          <div v-if="step === 3">
            <div class="card p-4">
              <h5 class="text-cream mb-4"><i class="bi bi-check-circle me-2 text-gold"></i>Review & Confirm</h5>

              <div class="mb-3">
                <div class="text-muted mb-1" style="font-size:.78rem; text-transform:uppercase; letter-spacing:.07em;">Shipping To</div>
                <div class="text-cream">{{ shipping.name }}</div>
                <div class="text-muted" style="font-size:.88rem;">{{ shipping.address }}, {{ shipping.city }}</div>
                <div class="text-muted" style="font-size:.88rem;">{{ shipping.phone }}</div>
              </div>
              <div class="mb-4">
                <div class="text-muted mb-1" style="font-size:.78rem; text-transform:uppercase; letter-spacing:.07em;">Payment Method</div>
                <div class="text-cream">{{ paymentMethods.find(m => m.value === payment.method)?.label }}</div>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-outline-gold px-4" @click="step = 2">
                  <i class="bi bi-arrow-left me-2"></i>Back
                </button>
                <button class="btn btn-gold px-4" @click="placeOrder" :disabled="loading">
                  <span class="spinner-border spinner-border-sm me-2" v-if="loading"></span>
                  <i class="bi bi-lock me-2" v-else></i>
                  {{ loading ? 'Placing order...' : 'Place Order' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Step 4: Success -->
          <div v-if="step === 4" class="text-center py-4">
            <div class="pulse-gold d-inline-block rounded-circle p-4 mb-4" style="background:rgba(46,204,113,.1);">
              <i class="bi bi-check-circle-fill" style="font-size:3rem; color:#2ecc71;"></i>
            </div>
            <h3 class="text-cream mb-2">Order Placed! 🎉</h3>
            <p class="text-muted mb-1">Your order #{{ orderId }} has been confirmed.</p>
            <div class="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-xl mb-3" style="background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.25);">
              <i class="bi bi-truck text-gold"></i>
              <span class="text-cream" style="font-size:.9rem;">Estimated delivery within <strong>3–5 business days</strong></span>
            </div>
            <p class="text-muted mb-4">You'll receive a confirmation email at {{ shipping.email }}</p>
            <div class="d-flex justify-content-center gap-3">
              <RouterLink class="btn btn-gold" to="/orders">Track Order</RouterLink>
              <RouterLink class="btn btn-outline-gold" to="/products">Continue Shopping</RouterLink>
            </div>
          </div>
        </div>

        <!-- Order summary sidebar -->
        <div class="col-lg-5" v-if="step < 4">
          <div class="card p-4 sticky-top" style="top:80px;">
            <h6 class="text-cream mb-3">Your Order</h6>
            <div class="d-flex flex-column gap-2 mb-3" style="max-height:280px; overflow-y:auto;">
              <div class="d-flex align-items-center gap-2" v-for="item in cart.items" :key="item.id">
                <div class="rounded overflow-hidden flex-shrink-0" style="width:40px; height:40px; background:var(--navy-light);">
                  <img :src="item.image" style="width:100%; height:100%; object-fit:cover;" v-if="item.image" />
                </div>
                <div class="flex-grow-1 min-w-0">
                  <div class="text-cream text-truncate" style="font-size:.85rem;">{{ item.name || item.product?.name }}</div>
                  <div class="d-flex align-items-center gap-2" style="font-size:.75rem;">
                    <span class="text-muted">Qty: {{ item.quantity || 1 }}</span>
                    <span class="badge" :class="isAdminOwned(item.product) ? 'badge-gold' : 'bg-info text-dark'" style="font-size:.58rem;">
                      {{ isAdminOwned(item.product) ? 'Tasleem' : 'Marketplace' }}
                    </span>
                  </div>
                </div>
                <div class="text-gold" style="font-size:.9rem; font-weight:600; flex-shrink:0;">{{ formatPrice((item.price || 0) * (item.quantity || 1)) }}</div>
              </div>
            </div>
            <hr class="divider-gold my-3" />
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Subtotal</span>
              <span class="text-cream">{{ formatPrice(cart.totalPrice) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Delivery ({{ cart.items.length }} × {{ formatPrice(DELIVERY) }})</span>
              <span class="text-cream">{{ formatPrice(deliveryTotal) }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-cream fw-700">Total</span>
              <span class="text-gold fw-700 fs-5">{{ formatPrice(cart.totalPrice + deliveryTotal) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { orderService, paymentService } from '@/services/api'
import { isAdminOwned } from '@/utils/helpers'
import { useToast } from 'vue-toastification'

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const toast = useToast()

const step = ref(1)
const loading = ref(false)
const orderId = ref(null)
const stepLabels = ['Shipping', 'Payment', 'Confirm', 'Done']

const shipping = reactive({
  name: auth.user?.name || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || '',
  address: auth.user?.address || '',   // prefilled from the account
  city: auth.user?.city || '',         // prefilled from the account
  postal_code: auth.user?.post_code || ''
})
const shippingErrors = reactive({ name: '', email: '', phone: '', address: '', city: '' })

const payment = reactive({ method: 'cash', card_number: '', expiry: '', cvv: '' })

const cities = ['Cairo', 'Giza', 'Alexandria', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El-Sheikh', 'Mansoura', 'Tanta', 'Zagazig']

const DELIVERY = 30
const deliveryTotal = computed(() => (cart.items?.length || 0) * DELIVERY)

const paymentMethods = [
  { value: 'wallet', label: 'Wallet', icon: 'bi bi-wallet2', desc: `Balance: ${formatPrice(auth.user?.wallet_balance || 0)} — held in escrow` },
  { value: 'cash', label: 'Cash on Delivery', icon: 'bi bi-cash-stack', desc: 'Pay when you receive your order' },
]

function formatPrice(v) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(v || 0)
}

function formatCardNumber(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16)
  payment.card_number = v.replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 4)
  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
  payment.expiry = v
}

function validateShipping() {
  Object.keys(shippingErrors).forEach(k => shippingErrors[k] = '')
  let valid = true
  if (!shipping.name.trim()) { shippingErrors.name = 'Required'; valid = false }
  if (!shipping.email) { shippingErrors.email = 'Required'; valid = false }
  if (!shipping.phone) { shippingErrors.phone = 'Required'; valid = false }
  if (!shipping.address.trim()) { shippingErrors.address = 'Required'; valid = false }
  if (!shipping.city) { shippingErrors.city = 'Required'; valid = false }
  return valid
}

function nextStep() {
  if (step.value === 1) {
    if (!validateShipping()) return
  }
  step.value++
}

async function placeOrder() {
  loading.value = true
  try {
    // Orders deliver to the buyer's stored address — persist what they entered
    // so the seller/admin see the right delivery details (best-effort).
    try { await auth.updateProfile({ address: shipping.address, city: shipping.city, phone: shipping.phone }) } catch (_) {}

    const me = auth.user?.id
    let lastOrderId = null
    // Each item is placed as its own escrow order (matches the backend model).
    for (const i of cart.items) {
      const pid = i.product_id || i.product?.id || i.id
      const qty = i.quantity || 1
      const price = Number(i.price ?? i.product?.price ?? 0)
      const res = await orderService.create({
        user_id: me,
        product_id: pid,
        quantity: qty,
        unit_price: price,
        payment_method: payment.method, // 'wallet' (escrow hold) | 'cash' (COD)
      })
      const order = res.data?.data || res.data
      lastOrderId = order?.order_id || order?.id || lastOrderId
    }
    orderId.value = lastOrderId || 'ORD-' + Date.now()

    await cart.clearCart()
    step.value = 4
    toast.success('Order placed successfully!')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to place order. Please try again.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (cart.isEmpty) router.push('/cart')
})
</script>

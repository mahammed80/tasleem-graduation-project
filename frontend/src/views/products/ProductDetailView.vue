<template>
  <div>
    <LoadingSpinner v-if="loading" text="Loading product..." height="60vh" />

    <div v-else-if="product">
      <!-- Header -->
      <div class="page-header">
        <div class="container">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0">
              <li class="breadcrumb-item"><RouterLink to="/">Home</RouterLink></li>
              <li class="breadcrumb-item"><RouterLink to="/products">Products</RouterLink></li>
              <li class="breadcrumb-item active text-truncate" style="max-width:200px;">{{ product.name }}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div class="container py-4">
        <div class="row g-5">
          <!-- Images -->
          <div class="col-lg-6">
            <div class="rounded-2xl overflow-hidden mb-3" style="background:var(--navy-light); height:420px;">
              <img :src="selectedImage" :alt="product.name" style="width:100%; height:100%; object-fit:cover;" v-if="selectedImage" />
              <div class="d-flex align-items-center justify-content-center h-100" v-else>
                <i class="bi bi-image text-muted" style="font-size:4rem;"></i>
              </div>
            </div>
            <!-- Thumbnails -->
            <div class="d-flex gap-2 flex-wrap" v-if="images.length > 1">
              <div v-for="img in images" :key="img.id || img"
                class="rounded-xl overflow-hidden cursor-pointer"
                style="width:72px; height:72px; flex-shrink:0; border:2px solid transparent; transition:.15s;"
                :style="{ borderColor: selectedImage === (img.url || img) ? 'var(--gold)' : 'transparent' }"
                @click="selectedImage = img.url || img">
                <img :src="img.url || img" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="col-lg-6">
            <!-- Category & badges -->
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span class="badge badge-gold" v-if="product.category">{{ product.category?.name }}</span>
              <!-- FIX: Use quantity instead of stock -->
              <span class="badge" style="background:rgba(46,204,113,.15); color:#2ecc71; border:1px solid rgba(46,204,113,.25);" v-if="product.quantity > 0">In Stock ({{ product.quantity }})</span>
              <span class="badge" style="background:rgba(231,76,60,.15); color:#e74c3c; border:1px solid rgba(231,76,60,.25);" v-else>Out of Stock</span>
              <!-- FIX: Check type field instead of is_rentable -->
              <span class="badge badge-gold" v-if="isRentable"><i class="bi bi-clock me-1"></i>Rentable</span>
            </div>

            <h1 class="text-cream mb-2" style="font-size:1.8rem;">{{ product.name }}</h1>

            <!-- Sold by (seller) -->
            <RouterLink v-if="product.owner" :to="isTasleem ? '/products' : `/products?seller=${product.owner.id}`"
              class="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none">
              <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dark),var(--gold));display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;color:var(--navy);flex-shrink:0;">
                {{ (isTasleem ? 'T' : (product.owner.name || 'S'))[0].toUpperCase() }}
              </div>
              <div>
                <div class="text-muted" style="font-size:.7rem;line-height:1;">Sold by</div>
                <div class="text-cream fw-600" style="font-size:.85rem;">
                  {{ isTasleem ? 'Tasleem Store' : (product.owner.name || 'Seller') }}
                  <span class="badge ms-1" :class="isTasleem ? 'badge-gold' : 'bg-info text-dark'" style="font-size:.58rem;vertical-align:middle;">{{ isTasleem ? 'Official' : 'Seller' }}</span>
                  <TrustBadge :user="product.owner" class="ms-1" />
                </div>
              </div>
            </RouterLink>

            <!-- Seller location (city only) + listing date — C2C listings only, not Tasleem -->
            <div v-if="!isTasleem && product.owner" class="d-flex flex-wrap align-items-center gap-3 mb-3 text-muted" style="font-size:.78rem;">
              <span v-if="product.owner.city"><i class="bi bi-geo-alt me-1 text-gold"></i>{{ product.owner.city }}</span>
              <span v-if="product.created_at"><i class="bi bi-calendar3 me-1 text-gold"></i>Listed {{ formatDate(product.created_at) }}</span>
            </div>

            <!-- Rating -->
            <!-- FIX: Use rate instead of rating -->
            <div class="d-flex align-items-center gap-3 mb-3" v-if="product.rate !== undefined">
              <StarRating :rating="product.rate" :count="product.reviews_count || reviews.length" />
            </div>

            <!-- Price -->
            <div class="mb-4">
              <span class="text-gold" style="font-size:2rem; font-weight:800;">{{ formatPrice(product.price) }}</span>
              <span class="text-muted ms-2 text-decoration-line-through" v-if="product.old_price">{{ formatPrice(product.old_price) }}</span>
              <!-- FIX: Show rental price if rentable -->
              <div class="text-muted mt-1" style="font-size:.85rem;" v-if="isRentable && product.daily_rental_price">
                <i class="bi bi-clock me-1"></i>{{ formatPrice(product.daily_rental_price) }} / day for rental
              </div>
            </div>

            <!-- Description -->
            <p class="text-muted mb-4" style="line-height:1.7;">{{ product.description }}</p>

            <!-- Buy: quantity + add to cart -->
            <div class="mb-3">
              <label class="form-label">Quantity</label>
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="d-flex align-items-center gap-2">
                  <button class="qty-btn" @click="quantity > 1 && quantity--">
                    <i class="bi bi-dash"></i>
                  </button>
                  <span class="text-cream px-2" style="font-size:1.1rem; min-width:30px; text-align:center;">{{ quantity }}</span>
                  <button class="qty-btn" @click="quantity < (product.quantity || 1) && quantity++" :disabled="quantity >= (product.quantity || 1)">
                    <i class="bi bi-plus"></i>
                  </button>
                </div>
                <span class="text-muted" style="font-size:.78rem;" v-if="product.quantity > 0">{{ product.quantity }} in stock</span>
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <button v-if="!isOwner" class="btn btn-gold px-4 py-2" @click="addToCart" :disabled="cartLoading || product.quantity === 0">
                  <span class="spinner-border spinner-border-sm me-2" v-if="cartLoading"></span>
                  <i class="bi bi-bag-plus me-2" v-else></i>
                  {{ product.quantity === 0 ? 'Out of Stock' : 'Add to Cart' }}
                </button>
                <button v-if="canOffer" class="btn btn-outline-gold px-4 py-2" @click="openOffer">
                  <i class="bi bi-tag me-2"></i>Make Offer
                </button>
                <button v-if="isOwner && !isTasleem" class="btn btn-outline-gold px-4 py-2" @click="boostListing" :disabled="boostLoading">
                  <span class="spinner-border spinner-border-sm me-2" v-if="boostLoading"></span>
                  <i class="bi bi-rocket-takeoff me-2" v-else></i>Boost
                </button>
                <button class="btn btn-outline-gold px-3 py-2" @click="toggleWishlist" :title="wishlist.isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'">
                  <i :class="wishlist.isInWishlist(product.id) ? 'bi bi-heart-fill text-danger' : 'bi bi-heart'"></i>
                </button>
                <ShareButton :title="product.name" />
              </div>
            </div>

            <!-- Rental section -->
            <!-- FIX: Use isRentable computed property -->
            <div v-if="isRentable" class="card p-3 mt-3" style="border-radius:1rem; border-color:rgba(201,169,110,.25)!important;">
              <h6 class="text-gold mb-3"><i class="bi bi-clock-history me-2"></i>Rent This Item</h6>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label">Start Date</label>
                  <input type="date" class="form-control form-control-sm" v-model="rental.start_date" :min="today" />
                </div>
                <div class="col-6">
                  <label class="form-label">End Date</label>
                  <input type="date" class="form-control form-control-sm" v-model="rental.end_date" :min="rental.start_date || today" />
                </div>
              </div>
              <div class="d-flex align-items-center justify-content-between mb-3" v-if="rentalTotal">
                <span class="text-muted">Total ({{ rentalDays }} days):</span>
                <span class="text-gold fw-700">{{ formatPrice(rentalTotal) }}</span>
              </div>
              <button class="btn btn-outline-gold w-100" @click="addRental" :disabled="!rental.start_date || !rental.end_date || rentalLoading">
                <span class="spinner-border spinner-border-sm me-2" v-if="rentalLoading"></span>
                <i class="bi bi-calendar-check me-2" v-else></i>Add Rental to Cart
              </button>
            </div>
          </div>
        </div>

        <!-- Reviews section -->
        <div class="mt-5">
          <hr class="divider-gold my-4" />
          <div class="row g-4">
            <div class="col-lg-8">
              <h4 class="section-title text-cream mb-4">Customer Reviews</h4>

              <!-- AI review-sentiment summary (semantic analysis) -->
              <div v-if="sentiment" class="card p-3 mb-4" style="border-color:rgba(201,169,110,.25)!important;">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <i class="bi bi-robot text-gold"></i>
                  <span class="text-cream fw-600" style="font-size:.9rem;">AI Review Sentiment</span>
                  <span class="badge ms-auto text-capitalize" :class="overallBadge">{{ sentiment.overall }}</span>
                </div>
                <div class="text-muted mb-2" style="font-size:.76rem;">Based on AI analysis of {{ sentiment.total_reviews }} review{{ sentiment.total_reviews !== 1 ? 's' : '' }}</div>
                <div v-for="b in sentimentBars" :key="b.label" class="d-flex align-items-center gap-2 mb-1">
                  <span style="width:64px;font-size:.74rem;color:var(--text-muted);">{{ b.label }}</span>
                  <div class="flex-grow-1 rounded-pill" style="height:7px;background:rgba(255,255,255,.08);overflow:hidden;">
                    <div class="h-100 rounded-pill" :style="{ width: Math.min(b.pct,100) + '%', background: b.color }"></div>
                  </div>
                  <span style="width:34px;text-align:right;font-size:.74rem;" class="text-cream">{{ Math.round(b.pct) }}%</span>
                </div>
                <div v-if="positiveSample" class="text-muted mt-2 fst-italic" style="font-size:.78rem;">
                  <i class="bi bi-quote text-gold me-1"></i>{{ positiveSample }}
                </div>
              </div>

              <div v-if="reviewsLoading">
                <div class="skeleton mb-3" style="height:80px;" v-for="n in 3" :key="n"></div>
              </div>
              <div v-else-if="reviews.length === 0" class="text-muted py-4">
                <i class="bi bi-chat-left-dots fs-3 d-block mb-2"></i>No reviews yet. Be the first!
              </div>
              <div class="d-flex flex-column gap-3" v-else>
                <div class="card p-3" v-for="review in reviews" :key="review.id">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <div style="width:36px; height:36px; border-radius:50%; background:var(--gold); display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--navy); font-size:.85rem; flex-shrink:0;">
                      {{ (review.user?.name || 'U')[0].toUpperCase() }}
                    </div>
                    <div>
                      <div class="text-cream fw-600" style="font-size:.9rem;">{{ review.user?.name || 'Anonymous' }}</div>
                      <StarRating :rating="review.rating" :showCount="false" />
                    </div>
                    <div class="ms-auto text-muted" style="font-size:.78rem;">{{ formatDate(review.created_at) }}</div>
                  </div>
                  <p class="text-muted mb-0" style="font-size:.88rem;">{{ review.comment }}</p>
                </div>
              </div>

              <!-- Write a review (auth required) -->
              <div class="card p-4 mt-4" v-if="auth.isAuthenticated">
                <h6 class="text-cream mb-3">Write a Review</h6>
                <div class="mb-3">
                  <label class="form-label">Your Rating</label>
                  <div class="d-flex gap-1">
                    <button v-for="n in 5" :key="n" class="btn btn-sm p-1 border-0 bg-transparent" @click="newReview.rating = n">
                      <i :class="n <= newReview.rating ? 'bi bi-star-fill' : 'bi bi-star'" :style="{ color: n <= newReview.rating ? 'var(--gold)' : 'var(--text-muted)', fontSize: '1.2rem' }"></i>
                    </button>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Your Review</label>
                  <textarea class="form-control" rows="3" placeholder="Share your experience..." v-model="newReview.comment"></textarea>
                </div>
                <button class="btn btn-gold btn-sm" @click="submitReview" :disabled="submitReviewLoading || !newReview.rating">
                  <span class="spinner-border spinner-border-sm me-1" v-if="submitReviewLoading"></span>
                  Submit Review
                </button>
              </div>
              <div class="card p-3 mt-3 text-center" v-else>
                <span class="text-muted">Please <RouterLink class="text-gold" to="/login">sign in</RouterLink> to write a review.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="text-center py-5">
      <i class="bi bi-box-seam text-muted" style="font-size:3rem;"></i>
      <h5 class="text-muted mt-3">Product not found</h5>
      <RouterLink class="btn btn-outline-gold mt-2" to="/products">Back to Products</RouterLink>
    </div>
  
    <!-- Complete the Setup (AI bundle) -->
    <section class="py-5" v-if="bundleProducts.length > 0">
      <div class="container">
        <div class="d-flex align-items-center gap-2 mb-4">
          <i class="bi bi-boxes text-gold fs-4"></i>
          <h3 class="text-cream mb-0">{{ bundleSection }}</h3>
        </div>
        <div class="row g-4">
          <div class="col-6 col-md-4 col-xl-3" v-for="p in bundleProducts" :key="p.id">
            <ProductCard :product="p" />
          </div>
        </div>
      </div>
    </section>

    <!-- Similar Products -->
    <section class="py-5" v-if="similarProducts.length > 0" style="background:var(--navy);">
      <div class="container">
        <div class="d-flex align-items-center gap-2 mb-4">
          <i class="bi bi-grid-3x3-gap text-gold fs-4"></i>
          <h3 class="text-cream mb-0">Similar Products</h3>
        </div>
        <div class="row g-4">
          <div class="col-6 col-md-4 col-xl-2" v-for="p in similarProducts" :key="p.id">
            <ProductCard :product="p" />
          </div>
        </div>
      </div>
    </section>

    <!-- Make Offer modal -->
    <Transition name="fade">
      <div v-if="showOffer" style="position:fixed;inset:0;z-index:1060;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);" @click.self="showOffer = false">
        <div class="card p-4" style="max-width:400px;width:100%;border-radius:1.25rem;">
          <h5 class="text-cream mb-1">Make an Offer</h5>
          <p class="text-muted mb-3" style="font-size:.82rem;">{{ product?.name }} · listed at {{ formatPrice(product?.price) }}</p>
          <label class="form-label">Your offer (EGP)</label>
          <input v-model="offerAmount" type="number" class="form-control mb-3" min="1" />
          <label class="form-label">Pay if accepted</label>
          <div class="d-flex gap-2 mb-3">
            <button class="btn btn-sm flex-grow-1" :class="offerMethod==='cash' ? 'btn-gold' : 'btn-outline-gold'" @click="offerMethod='cash'"><i class="bi bi-truck me-1"></i>Cash on Delivery</button>
            <button class="btn btn-sm flex-grow-1" :class="offerMethod==='wallet' ? 'btn-gold' : 'btn-outline-gold'" @click="offerMethod='wallet'"><i class="bi bi-wallet2 me-1"></i>Wallet ({{ formatPrice(walletStore.balance, 0) }})</button>
          </div>
          <label class="form-label mt-1">Deliver to</label>
          <div v-if="canOrder" class="text-muted mb-3" style="font-size:.82rem;line-height:1.5;">
            {{ auth.user.name }} · {{ auth.user.phone }}<br>{{ [auth.user.address, auth.user.city].filter(Boolean).join(', ') }}
          </div>
          <div v-else class="mb-3" style="font-size:.82rem;color:#e74c3c;">
            A phone number and address are required — once accepted this becomes an order.
            <RouterLink to="/profile" class="text-gold d-block mt-1" @click="showOffer = false">Add address &amp; phone</RouterLink>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-gold w-100" @click="submitOffer" :disabled="offerLoading || !canOrder">
              <span class="spinner-border spinner-border-sm me-2" v-if="offerLoading"></span>Send Offer
            </button>
            <button class="btn btn-outline-gold w-100" @click="showOffer = false">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
</div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService, aiService, imageService, reviewService, boostService } from '@/services/api'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthStore } from '@/stores/auth'
import { useOffersStore } from '@/stores/offers'
import { useWalletStore } from '@/stores/wallet'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import StarRating from '@/components/ui/StarRating.vue'
import ShareButton from '@/components/ui/ShareButton.vue'
import ProductCard from '@/components/ui/ProductCard.vue'
import { productImage as resolveImage, fixImageUrl } from '@/utils/helpers'
import { aiSimilar, aiBundle } from '@/services/ai'
import TrustBadge from '@/components/ui/TrustBadge.vue'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const wishlist = useWishlistStore()
const auth = useAuthStore()
const offers = useOffersStore()
const walletStore = useWalletStore()
const toast = useToast()

const product = ref(null)
const images = ref([])
const selectedImage = ref(null)
const reviews = ref([])
const sentiment = ref(null)
const similarProducts = ref([])
const bundleProducts = ref([])
const bundleSection = ref('Complete the Setup')

const overallBadge = computed(() => ({ positive: 'bg-success', negative: 'bg-danger' })[sentiment.value?.overall] || 'bg-warning text-dark')
const positiveSample = computed(() => sentiment.value?.sample_reviews?.positive?.[0] || '')
const sentimentBars = computed(() => sentiment.value ? [
  { label: 'Positive', pct: Number(sentiment.value.positive_pct) || 0, color: '#2ecc71' },
  { label: 'Neutral',  pct: Number(sentiment.value.neutral_pct) || 0,  color: 'var(--gold)' },
  { label: 'Negative', pct: Number(sentiment.value.negative_pct) || 0, color: '#e74c3c' },
] : [])

async function fetchBundle() {
  const b = await aiBundle(product.value.id, 4)
  bundleProducts.value = b.products
  bundleSection.value = b.section
}

async function fetchSentiment() {
  try {
    const res = await aiService.reviewSentiment(route.params.id)
    const s = res.data
    if (s && Number(s.total_reviews) > 0) sentiment.value = s
  } catch (_) { sentiment.value = null }
}
const loading = ref(true)
const cartLoading = ref(false)
const rentalLoading = ref(false)
const reviewsLoading = ref(true)
const submitReviewLoading = ref(false)
const quantity = ref(1)
const rental = ref({ start_date: '', end_date: '' })
const newReview = ref({ rating: 0, comment: '' })
const today = new Date().toISOString().split('T')[0]

// FIX: Computed property to check if product is rentable based on type field
const isRentable = computed(() => {
  return product.value?.type === 'rental' || product.value?.type === 'both'
})
const isForSale = computed(() => {
  const t = product.value?.type
  return t === 'sale' || t === 'both' || t === undefined
})

// C2C vs Tasleem store, and ownership.
const isTasleem = computed(() => product.value?.owner?.role === 'admin')
const isOwner   = computed(() => product.value?.owner?.id && product.value.owner.id === auth.user?.id)
// Make Offer: only a logged-in non-owner, on a C2C item that's for sale.
const canOffer  = computed(() => auth.isAuthenticated && !isOwner.value && !isTasleem.value && isForSale.value)
// An accepted offer becomes an order, so phone + address are required up front.
const hasAddress = computed(() => (auth.user?.address || '').trim().length > 0)
const hasPhone   = computed(() => (auth.user?.phone || '').trim().length > 0)
const canOrder   = computed(() => hasAddress.value && hasPhone.value)

// ── Make Offer ──
const showOffer = ref(false)
const offerAmount = ref(0)
const offerMethod = ref('cash') // COD by default so the seller's accept never fails on funds
const offerLoading = ref(false)

function openOffer() {
  if (!auth.isAuthenticated) { toast.info('Please sign in'); router.push({ name: 'Login' }); return }
  offerAmount.value = Math.round((product.value?.price || 0) * 0.9)
  walletStore.fetch()
  showOffer.value = true
}
async function submitOffer() {
  const amt = Number(offerAmount.value)
  if (!(amt > 0)) { toast.error('Enter a valid amount'); return }
  if (offerMethod.value === 'wallet' && walletStore.balance < amt + 30) {
    toast.error('Not enough wallet balance — top up or choose Cash on Delivery'); return
  }
  offerLoading.value = true
  try {
    await offers.make({ product_id: product.value.id, amount: amt, payment_method: offerMethod.value })
    toast.success('Offer sent to the seller')
    showOffer.value = false
  } catch (e) {
    toast.error(e.response?.data?.message || 'Could not send offer')
  } finally { offerLoading.value = false }
}

// ── Boost (owner, C2C only) ──
const boostLoading = ref(false)
async function boostListing() {
  boostLoading.value = true
  try {
    await boostService.boost(product.value.id, 3)
    toast.success('Listing boosted for 3 days')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Could not boost listing')
  } finally { boostLoading.value = false }
}

const rentalDays = computed(() => {
  if (!rental.value.start_date || !rental.value.end_date) return 0
  const ms = new Date(rental.value.end_date) - new Date(rental.value.start_date)
  return Math.max(Math.ceil(ms / 86400000), 0)
})
const rentalTotal = computed(() => rentalDays.value * (product.value?.daily_rental_price || 0))

function formatPrice(val) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(val || 0)
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
}

async function addToCart() {
  if (!auth.isAuthenticated) { 
    toast.info('Please sign in')
    router.push({ name: 'Login' })
    return 
  }
  cartLoading.value = true
  const res = await cart.addItem(product.value.id, quantity.value)
  cartLoading.value = false
  if (res?.success) {
    toast.success('Added to cart!')
    cart.openCart()
  } else {
    toast.error(res?.message || 'Failed to add to cart')
  }
}

async function addRental() {
  if (!auth.isAuthenticated) { 
    toast.info('Please sign in')
    router.push({ name: 'Login' })
    return 
  }
  if (!rental.value.start_date || !rental.value.end_date) { 
    toast.error('Please select rental dates')
    return 
  }
  rentalLoading.value = true
  const res = await cart.addRental(product.value.id, rental.value.start_date, rental.value.end_date)
  rentalLoading.value = false
  if (res.success) { 
    toast.success('Rental added to cart!')
    cart.openCart() 
  } else {
    toast.error(res.message)
  }
}

async function toggleWishlist() {
  const res = await wishlist.toggle(product.value.id)
  if (res?.needsAuth) { 
    toast.info('Please sign in')
    router.push({ name: 'Login' })
    return 
  }
  if (res?.added) toast.success('Added to wishlist')
  else if (res?.added === false) toast.info('Removed from wishlist')
}

async function submitReview() {
  if (!auth.isAuthenticated) { toast.info('Please sign in to write a review'); return }
  if (!newReview.value.rating) {
    toast.error('Please select a rating')
    return
  }
  submitReviewLoading.value = true
  try {
    // Backend requires user_id (the Flutter app sends it too).
    await reviewService.create({ product_id: product.value.id, user_id: auth.user.id, ...newReview.value })
    toast.success('Review submitted!')
    newReview.value = { rating: 0, comment: '' }
    await fetchReviews()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to submit review')
  } finally {
    submitReviewLoading.value = false
  }
}

async function fetchReviews() {
  reviewsLoading.value = true
  try {
    const res = await reviewService.getAll({ product_id: route.params.id })
    reviews.value = res.data?.data || res.data || []
  } catch (_) {
    reviews.value = []
  } finally {
    reviewsLoading.value = false
  }
}

async function fetchSimilarProducts() {
  // AI (semantic) similar first — same as Flutter — hydrated to full products;
  // fall back to the Laravel `similar` endpoint if the AI has no match.
  const ai = await aiSimilar(product.value.id)
  if (ai.length) { similarProducts.value = ai; return }
  try {
    const res = await productService.similar(product.value.id)
    similarProducts.value = res.data?.data || res.data || []
  } catch (_) {
    similarProducts.value = []
  }
}

async function loadProduct() {
  loading.value = true
  // Reset per-product state (matters when navigating product → similar product).
  product.value = null; images.value = []; selectedImage.value = null
  reviews.value = []; similarProducts.value = []; bundleProducts.value = []; sentiment.value = null
  quantity.value = 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
  try {
    const [prodRes, imgRes] = await Promise.all([
      productService.getById(route.params.id),
      imageService.getAll(route.params.id).catch(() => ({ data: [] }))
    ])
    product.value = prodRes.data?.data || prodRes.data
    // Normalise images to plain URL strings (backend exposes `image_url`).
    const rawImgs = imgRes.data?.data || imgRes.data || product.value?.images || []
    images.value = (Array.isArray(rawImgs) ? rawImgs : [])
      .map(i => fixImageUrl(i.image_url || i.url || i.image || i))
      .filter(Boolean)
    if (!images.value.length) {
      const pi = resolveImage(product.value)
      if (pi) images.value = [pi]
    }
    selectedImage.value = images.value[0] || null

    await Promise.all([
      fetchReviews(),
      fetchSimilarProducts(),
      fetchSentiment(),
      fetchBundle()
    ])
  } catch (_) {
    product.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadProduct)
// Re-load when navigating to another product (same route, new :id).
watch(() => route.params.id, (id, old) => { if (id && id !== old) loadProduct() })
</script>
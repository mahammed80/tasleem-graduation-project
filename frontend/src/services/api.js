import axios from 'axios'
import { useToast } from 'vue-toastification'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://tasleembackendapifinal-production.up.railway.app/api/v1/',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
})

// ── Attach Bearer token ───────────────────────────────────────
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('tasleem_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  err => Promise.reject(err)
)

// ── Handle 401 (auth) + 429 (rate limit / WAF throttle) globally ──
api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    if (status === 401) {
      localStorage.removeItem('tasleem_token')
      localStorage.removeItem('tasleem_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    } else if (status === 429) {
      // Too Many Requests — Laravel throttle / WAF rate limit. Surface a
      // friendly message + the server's Retry-After when present.
      const retry = err.response?.headers?.['retry-after']
      const msg = err.response?.data?.message ||
        `Too many requests — please slow down${retry ? ` and try again in ${retry}s` : ''}.`
      try { useToast().warning(msg) } catch (_) { /* toast not ready */ }
    } else if (status === 403 && /blocked|forbidden|firewall|waf/i.test(err.response?.data?.message || '')) {
      // A WAF/firewall block surfaced as 403 with a relevant message.
      try { useToast().error(err.response.data.message) } catch (_) {}
    }
    return Promise.reject(err)
  }
)

export default api

// ─────────────────────────────────────────────────────────────
// AUTH  POST /register  POST /login  POST /logout  GET /me
// Note: forgot-password / reset-password / verify-email are
//       NOT in this backend — those views are hidden in the UI.
// ─────────────────────────────────────────────────────────────
export const authService = {
  register: data => api.post('/register', data),
  login:    data => api.post('/login', data),
  logout:   ()   => api.post('/logout'),
  me:       ()   => api.get('/me'),
  forgotPassword:     data => api.post('/forgot-password', data),
  resetPassword:      data => api.post('/reset-password', data),
  resendVerification: ()   => api.post('/email/verification-notification'),
}

// ─────────────────────────────────────────────────────────────
// USERS  — all routes match ✓
// GET    /users               GET    /users/{id}
// POST   /users               PUT    /users/{id}
// DELETE /users/{id}
// GET    /users/{id}/products
// GET    /users/{id}/orders
// GET    /users/{id}/rentals
// ─────────────────────────────────────────────────────────────
export const userService = {
  getAll:      params     => api.get('/users', { params }),
  getById:     id         => api.get(`/users/${id}`),
  create:      data       => api.post('/users', data),
  update:      (id, data) => api.put(`/users/${id}`, data),
  delete:      id         => api.delete(`/users/${id}`),
  getProducts: id         => api.get(`/users/${id}/products`),
  getOrders:   id         => api.get(`/users/${id}/orders`),
  getRentals:  id         => api.get(`/users/${id}/rentals`),
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS
// GET    /products             GET    /products/{id}
// POST   /products             PUT    /products/{id}   ← real PUT (not POST+_method)
// DELETE /products/{id}
// GET    /products/{id}/similar  ← new endpoint
// ─────────────────────────────────────────────────────────────
export const productService = {
  // `config` lets callers override e.g. timeout for slower large-page fetches.
  getAll:   (params, config = {}) => api.get('/products', { params, ...config }),
  getById:  id         => api.get(`/products/${id}`),
  similar:  id         => api.get(`/products/${id}/similar`),
  // Create as JSON; images are uploaded separately via imageService (2-step).
  create:   data       => api.post('/products', data),
  // ✅ Fixed: was POST (with _method=PUT hack) → now real PUT
  update:   (id, data) => api.put(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // JSON field update (admin edit price / add stock). Backend requires `status`.
  updateFields: (id, data) => api.put(`/products/${id}`, data),
  delete:   id         => api.delete(`/products/${id}`),
}

// ─────────────────────────────────────────────────────────────
// CATEGORIES  — all routes match ✓
// ─────────────────────────────────────────────────────────────
export const categoryService = {
  getAll:  ()         => api.get('/categories'),
  getById: id         => api.get(`/categories/${id}`),
  create:  data       => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
  delete:  id         => api.delete(`/categories/${id}`),
}

// ─────────────────────────────────────────────────────────────
// ORDERS  — all routes match ✓
// ─────────────────────────────────────────────────────────────
export const orderService = {
  getAll:  params     => api.get('/orders', { params }),
  getById: id         => api.get(`/orders/${id}`),
  create:  data       => api.post('/orders', data),
  update:  (id, data) => api.put(`/orders/${id}`, data),
  delete:  id         => api.delete(`/orders/${id}`),
  // ── C2C escrow actions (buyer → seller → admin) ──
  sellerConfirm: id   => api.post(`/orders/${id}/seller-confirm`), // seller accepts
  complete:      id   => api.post(`/orders/${id}/complete`),       // admin: release payout
  cancel:        id   => api.post(`/orders/${id}/cancel`),         // refund + relist
}

// ─────────────────────────────────────────────────────────────
// RENTALS  — all routes match ✓
// ─────────────────────────────────────────────────────────────
export const rentalService = {
  getAll:  params     => api.get('/rentals', { params }),
  getById: id         => api.get(`/rentals/${id}`),
  create:  data       => api.post('/rentals', data),
  update:  (id, data) => api.put(`/rentals/${id}`, data),
  return:  id         => api.put(`/rentals/${id}`, { status: 'returned' }),
  delete:  id         => api.delete(`/rentals/${id}`),
}

// ─────────────────────────────────────────────────────────────
// REVIEWS  — all routes match ✓
// ─────────────────────────────────────────────────────────────
export const reviewService = {
  getAll:  params     => api.get('/reviews', { params }),
  getById: id         => api.get(`/reviews/${id}`),
  create:  data       => api.post('/reviews', data),
  update:  (id, data) => api.put(`/reviews/${id}`, data),
  delete:  id         => api.delete(`/reviews/${id}`),
}

// ─────────────────────────────────────────────────────────────
// PAYMENTS  — all routes match ✓
// ─────────────────────────────────────────────────────────────
export const paymentService = {
  getAll:  params     => api.get('/payments', { params }),
  getById: id         => api.get(`/payments/${id}`),
  create:  data       => api.post('/payments', data),
  update:  (id, data) => api.put(`/payments/${id}`, data),
  delete:  id         => api.delete(`/payments/${id}`),
}

// ─────────────────────────────────────────────────────────────
// CART
// GET    /cart
// POST   /cart               ← purchases AND rentals (no separate rental endpoint)
// PUT    /cart/{id}
// DELETE /cart/{id}
// DELETE /cart/clear/{user_id}   ← ✅ Fixed: was DELETE /cart
// ─────────────────────────────────────────────────────────────
export const cartService = {
  get:        ()              => api.get('/cart'),
  addItem:    data            => api.post('/cart', data),
  // ✅ Fixed: rentals also go to POST /cart (no /cart/rentals endpoint)
  addRental:  data            => api.post('/cart', { ...data, type: 'rental' }),
  updateItem: (id, data)      => api.put(`/cart/${id}`, data),
  removeItem: id              => api.delete(`/cart/${id}`),
  // ✅ Fixed: was DELETE /cart → now DELETE /cart/clear/{user_id}
  clear:      userId          => api.delete(`/cart/clear/${userId}`),
}

// ─────────────────────────────────────────────────────────────
// WISHLIST
// GET    /wishlist
// POST   /wishlist
// GET    /wishlist/check          ← query param, not path segment
// DELETE /wishlist/{id}
// DELETE /wishlist/clear/{userId} ← ✅ Fixed: was DELETE /wishlist
// ─────────────────────────────────────────────────────────────
export const wishlistService = {
  getAll: (params)   => api.get('/wishlist', { params }),
  add:    data       => api.post('/wishlist', data),
  // ✅ Fixed: was /wishlist/check/{id} → now query param
  check:  productId  => api.get('/wishlist/check', { params: { product_id: productId } }),
  remove: id         => api.delete(`/wishlist/${id}`),
  // ✅ Fixed: was DELETE /wishlist → now DELETE /wishlist/clear/{userId}
  clear:  userId     => api.delete(`/wishlist/clear/${userId}`),
}

// ─────────────────────────────────────────────────────────────
// PRODUCT IMAGES  ← ✅ All paths fixed — flat /product-images/ resource
// GET    /products/{productId}/images       (list — nested under product)
// GET    /product-images/{id}               (single)
// PUT    /product-images/{id}               (update alt text)
// DELETE /product-images/{id}              (single delete)
// POST   /product-images/upload             (multi upload)
// POST   /product-images/upload-single      (single upload)
// DELETE /product-images/delete-multiple    (bulk delete)
// ─────────────────────────────────────────────────────────────
export const imageService = {
  // List still uses the product-nested route (unchanged ✓)
  getAll:       productId            => api.get(`/products/${productId}/images`),
  // Single-image operations now use flat /product-images/ routes
  get:          imageId              => api.get(`/product-images/${imageId}`),
  upload:       data                 => api.post('/product-images/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadSingle: data                 => api.post('/product-images/upload-single', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateAlt:    (imageId, data)      => api.put(`/product-images/${imageId}`, data),
  delete:       imageId              => api.delete(`/product-images/${imageId}`),
  bulkDelete:   data                 => api.delete('/product-images/delete-multiple', { data }),
}

// ─────────────────────────────────────────────────────────────
// RECOMMENDATIONS  — routes match ✓
// ─────────────────────────────────────────────────────────────
export const recommendationService = {
  getAll:  params     => api.get('/recommendations', { params }),
  getById: id         => api.get(`/recommendations/${id}`),
  create:  data       => api.post('/recommendations', data),
  update:  (id, data) => api.put(`/recommendations/${id}`, data),
  delete:  id         => api.delete(`/recommendations/${id}`),
}

// ─────────────────────────────────────────────────────────────
// LOGS  — ✅ Added missing endpoints
// GET /logs                              (all logs)
// GET /logs/{id}                         (single)
// GET /logs/stats                        (admin stats)
// GET /logs/user/{userId}               (per-user)
// GET /logs/entity/{entityType}/{id}    (per-entity)
// ─────────────────────────────────────────────────────────────
export const logService = {
  getAll:        params              => api.get('/logs', { params }),
  getById:       id                  => api.get(`/logs/${id}`),
  getStats:      ()                  => api.get('/logs/stats'),
  getByUser:     userId              => api.get(`/logs/user/${userId}`),
  getByEntity:   (entityType, id)    => api.get(`/logs/entity/${entityType}/${id}`),
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS  — now LIVE in the backend.
// GET /notifications  → { notifications: [...], unread_count }
// ─────────────────────────────────────────────────────────────
export const notificationService = {
  getAll:         () => api.get('/notifications'),
  markRead:       id => api.post(`/notifications/${id}/read`),
  markAllRead:    () => api.post('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications'),
}

// ─────────────────────────────────────────────────────────────
// WALLET (simulated C2C escrow wallet)
// GET  /wallet         → { balance, transactions: [...] }
// POST /wallet/topup   { amount }
// ─────────────────────────────────────────────────────────────
export const walletService = {
  get:   ()       => api.get('/wallet'),
  topup: amount   => api.post('/wallet/topup', { amount }),
}

// ─────────────────────────────────────────────────────────────
// OFFERS — buyer makes an offer on a C2C listing; seller accepts/rejects.
// GET  /offers?seller_id= | ?buyer_id=
// POST /offers              { product_id, amount, payment_method }
// POST /offers/{id}/accept  → creates the order
// POST /offers/{id}/reject
// ─────────────────────────────────────────────────────────────
export const offerService = {
  received: sellerId => api.get('/offers', { params: { seller_id: sellerId } }),
  sent:     buyerId  => api.get('/offers', { params: { buyer_id: buyerId } }),
  make:     data     => api.post('/offers', data),
  accept:   id       => api.post(`/offers/${id}/accept`),
  reject:   id       => api.post(`/offers/${id}/reject`),
}

// ─────────────────────────────────────────────────────────────
// BOOST — seller pays to float a listing to the top.
// POST /products/{id}/boost  { days }
// ─────────────────────────────────────────────────────────────
export const boostService = {
  boost: (productId, days) => api.post(`/products/${productId}/boost`, { days }),
}

// ─────────────────────────────────────────────────────────────
// ADMIN — exact dashboard figures in one call.
// GET /admin/stats → { products, orders, rentals, revenue, users }
// ─────────────────────────────────────────────────────────────
export const adminService = {
  stats: () => api.get('/admin/stats'),
}

// ─────────────────────────────────────────────────────────────────
// AI  — personalized recommendations, trending, search, assistant
// ─────────────────────────────────────────────────────────────────
// The AI microservice (FastAPI) is a SEPARATE host from Laravel. Sentiment
// returns full data (not IDs), so we call it directly. CORS is open.
const AI_BASE = import.meta.env.VITE_AI_BASE_URL || 'https://tasleem-ai-service-production-3dc3.up.railway.app'

// All AI endpoints return ID lists (except sentiment/bundle), e.g. {ids:[…]}.
// They live on the FastAPI service, NOT Laravel — call it directly (CORS open).
const aiGet = (path, params) => axios.get(`${AI_BASE}${path}`, { params, timeout: 12000 })
export const aiService = {
  trending:   (k = 8)               => aiGet('/trending', { k }),
  explore:    (k = 8)               => aiGet('/explore', { k }),
  similar:    (productId, k = 8)    => aiGet(`/similar/${productId}`, { k }),
  recommend:  (userId, k = 8)       => aiGet(`/recommend/user/${userId}`, { k }),
  bundle:     (productId, k = 4)    => aiGet(`/bundle/${productId}`, { k }),
  search:     (q, k = 30)           => aiGet('/search', { q, k }),
  assistant:  (query, k = 8)        => aiGet('/search', { q: query, k }),
  reviewSentiment: productId        => aiGet(`/reviews/summary/${productId}`),
  // Listing-photo gate: is this image an electronic product?
  detectElectronic: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return axios.post(`${AI_BASE}/detect/electronic`, fd, { timeout: 20000 })
  },
}

// Keep old recommendationService as alias so nothing breaks
// export const recommendationService = {
//   getAll: params => api.get('/recommendations', { params }),
//   getById: id => api.get(`/recommendations/${id}`),
// }

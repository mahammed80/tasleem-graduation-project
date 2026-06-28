/**
 * Tasleem Mock Adapter
 * Intercepts all axios requests and returns realistic mock data.
 * Enable by setting VITE_USE_MOCKS=true in your .env file.
 */

import mockData from './data.json'

const DELAY_MIN = 200
const DELAY_MAX = 600

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
function randomDelay() { return delay(DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN)) }

const state = {
  users:           [...(mockData.users['GET /users'].response.data)],
  categories:      [...(mockData.categories['GET /categories'].response.data)],
  products:        [...(mockData.products['GET /products'].response.data)],
  orders:          [...(mockData.orders['GET /orders'].response.data)],
  rentals:         [...(mockData.rentals['GET /rentals'].response.data)],
  reviews:         [...(mockData.reviews['GET /reviews'].response.data)],
  payments:        [...(mockData.payments['GET /payments'].response.data)],
  cartItems:       [...(mockData.cart['GET /cart'].response.items)],
  cartRentals:     [...(mockData.cart['GET /cart'].response.rental_items)],
  wishlist:        [...(mockData.wishlist['GET /wishlist'].response.data)],
  notifications:   [...(mockData.notifications['GET /notifications'].response.data)],
  recommendations: [...(mockData.recommendations['GET /recommendations'].response.data)],
  logs:            [...(mockData.logs['GET /logs'].response.data)],
  currentUser:     null,
  currentToken:    null,
  nextId:          200,
}

state.currentUser  = mockData.auth['GET /me'].response.user
state.currentToken = mockData.auth['POST /login'].response.token

function nextId() { return ++state.nextId }

function ok(data, status = 200) {
  return { data, status, statusText: 'OK', headers: { 'content-type': 'application/json' }, config: {} }
}

function paginate(items, params = {}) {
  const page     = parseInt(params.page     || 1)
  const perPage  = parseInt(params.per_page || 15)
  const total    = items.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const from     = (page - 1) * perPage
  const sliced   = items.slice(from, from + perPage)
  return { data: sliced, current_page: page, last_page: lastPage, per_page: perPage, total, from: from + 1, to: from + sliced.length }
}

// ── URL parser ────────────────────────────────────────────────────────
function parseUrl(url) {
  const [path, qs] = url.split('?')
  const params = {}
  if (qs) {
    qs.split('&').forEach(p => {
      const [k, v] = p.split('=')
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '')
    })
  }
  const segments = path.replace(/^\/api\/v1/, '').replace(/^\//, '').split('/')
  return { path, segments, params }
}

// ── Route handlers ─────────────────────────────────────────────────────
function handle(method, url, body) {
  const { segments, params } = parseUrl(url)
  const [s0, s1, s2, s3] = segments

  /* ── AUTH ────────────────────────────────────────────────── */
  if (s0 === 'register' && method === 'POST') {
    const user = { id: nextId(), name: body.name, email: body.email, phone: body.phone || null, national_id: body.national_id || null, role: 'user', email_verified_at: null, city: null, address: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    const token = `mock-token-${user.id}-${Date.now()}`
    state.users.push(user)
    state.currentUser  = user
    state.currentToken = token
    return ok({ user, token }, 201)
  }
  if (s0 === 'login' && method === 'POST') {
    const user = state.users.find(u => u.email === body.email) || state.currentUser
    if (!user) return error(422, { message: 'These credentials do not match our records.', errors: { email: ['Invalid credentials'] } })
    const token = `mock-token-${user.id}-${Date.now()}`
    state.currentUser  = user
    state.currentToken = token
    return ok({ user, token })
  }
  if (s0 === 'logout' && method === 'POST') return ok({ message: 'Logged out successfully.' })
  if (s0 === 'me' && method === 'GET') return ok({ user: state.currentUser })
  if (s0 === 'forgot-password' && method === 'POST') return ok({ message: 'Password reset link sent to your email.' })
  if (s0 === 'reset-password' && method === 'POST') {
    const token = `mock-token-reset-${Date.now()}`
    return ok({ message: 'Password reset successfully.', user: state.currentUser, token })
  }
  if (s0 === 'verify-email') return ok({ message: 'Email verified successfully.' })
  if (s0 === 'email' && method === 'POST') return ok({ message: 'Verification link resent.' })

  /* ── USERS ───────────────────────────────────────────────── */
  if (s0 === 'users') {
    if (!s1) {
      if (method === 'GET') {
        let list = [...state.users]
        if (params.search) list = list.filter(u => u.name?.toLowerCase().includes(params.search.toLowerCase()) || u.email?.toLowerCase().includes(params.search.toLowerCase()))
        if (params.role)   list = list.filter(u => u.role === params.role)
        return ok(paginate(list, params))
      }
      if (method === 'POST') {
        const user = { id: nextId(), ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        state.users.push(user)
        return ok({ message: 'User created successfully.', user }, 201)
      }
    }
    const id   = parseInt(s1)
    if (s2 === 'products') return ok({ data: state.products.filter(p => p.user_id === id) })
    if (s2 === 'orders')   return ok({ data: state.orders.filter(o => o.user_id === id) })
    if (s2 === 'rentals')  return ok({ data: state.rentals.filter(r => r.user_id === id) })
    const user = state.users.find(u => u.id === id)
    if (!user) return error(404)
    if (method === 'GET')    return ok(user)
    if (method === 'PUT')    { Object.assign(user, { ...body, updated_at: new Date().toISOString() }); if (state.currentUser?.id === id) state.currentUser = user; return ok({ message: 'User updated successfully.', user }) }
    if (method === 'DELETE') { state.users = state.users.filter(u => u.id !== id); return ok({ message: 'User deleted successfully.' }) }
  }

  /* ── CATEGORIES ──────────────────────────────────────────── */
  if (s0 === 'categories') {
    if (!s1) {
      if (method === 'GET')  return ok({ data: state.categories })
      if (method === 'POST') { const cat = { id: nextId(), slug: body.name?.toLowerCase().replace(/\s+/g, '-'), products_count: 0, ...body }; state.categories.push(cat); return ok(cat, 201) }
    }
    const id  = parseInt(s1)
    const cat = state.categories.find(c => c.id === id)
    if (!cat) return error(404)
    if (method === 'GET')    return ok(cat)
    if (method === 'PUT')    { Object.assign(cat, body); return ok(cat) }
    if (method === 'DELETE') { state.categories = state.categories.filter(c => c.id !== id); return ok({ message: 'Category deleted.' }) }
  }

  /* ── PRODUCTS ────────────────────────────────────────────── */
  if (s0 === 'products' && !s2) {
    const productId = s1 ? parseInt(s1) : null
    if (!productId) {
      if (method === 'GET') {
        let list = [...state.products]
        // ── Search
        if (params.search) {
          const q = params.search.toLowerCase()
          list = list.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
        }
        // ── Category
        if (params.category_id) list = list.filter(p => p.category_id === parseInt(params.category_id))
        // ── Rentable
        if (params.is_rentable === '1' || params.is_rentable === 1) list = list.filter(p => p.is_rentable)
        // ── Price range
        if (params.min_price) list = list.filter(p => p.price >= parseFloat(params.min_price))
        if (params.max_price) list = list.filter(p => p.price <= parseFloat(params.max_price))
        // ── Sorting
        if (params.sort === 'price_asc')  list = [...list].sort((a, b) => a.price - b.price)
        if (params.sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price)
        if (params.sort === 'newest')     list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        if (params.sort === 'rating')     list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))
        return ok(paginate(list, params))
      }
      if (method === 'POST') {
        // Handle both FormData and plain objects
        const bodyData = body instanceof FormData ? Object.fromEntries(body.entries()) : body
        const cat = state.categories.find(c => c.id === parseInt(bodyData.category_id))
        const product = {
          id: nextId(), ...bodyData,
          price:              parseFloat(bodyData.price) || 0,
          old_price:          bodyData.old_price ? parseFloat(bodyData.old_price) : null,
          stock:              parseInt(bodyData.stock) || 0,
          is_rentable:        bodyData.is_rentable === '1' || bodyData.is_rentable === true || bodyData.is_rentable === 1,
          daily_rental_price: bodyData.daily_rental_price ? parseFloat(bodyData.daily_rental_price) : null,
          listing_type:       bodyData.listing_type || 'sale',
          rating: 0, reviews_count: 0, views_count: 0,
          image:   `https://picsum.photos/seed/product-${state.nextId}/600/600`,
          images:  [],
          category: cat || null,
          user_id:  state.currentUser?.id,
          seller:   { id: state.currentUser?.id, name: state.currentUser?.name },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        state.products.push(product)
        return ok({ message: 'Product created successfully.', data: product }, 201)
      }
    }
    const product = state.products.find(p => p.id === productId)
    if (!product) return error(404)
    if (method === 'GET') return ok({ ...product, reviews: state.reviews.filter(r => r.product_id === productId) })
    if (method === 'POST' || method === 'PUT') {
      const bodyData = body instanceof FormData ? Object.fromEntries(body.entries()) : body
      const updates  = { ...bodyData, updated_at: new Date().toISOString() }
      if (updates.price) updates.price = parseFloat(updates.price)
      if (updates.stock) updates.stock = parseInt(updates.stock)
      if (updates.is_rentable !== undefined) updates.is_rentable = updates.is_rentable === '1' || updates.is_rentable === true || updates.is_rentable === 1
      Object.assign(product, updates)
      return ok({ message: 'Product updated.', data: product })
    }
    if (method === 'DELETE') { state.products = state.products.filter(p => p.id !== productId); return ok({ message: 'Product deleted.' }) }
  }

  /* ── PRODUCT IMAGES (nested) ─────────────────────────────── */
  if (s0 === 'products' && s2 === 'images') {
    const pid     = parseInt(s1)
    const product = state.products.find(p => p.id === pid)
    if (!product) return error(404)
    if (!product.images) product.images = []
    if (!s3) {
      if (method === 'GET')  return ok({ data: product.images })
      if (method === 'POST') { const imgs = [{ id: nextId(), product_id: pid, url: `https://picsum.photos/seed/img-${state.nextId}/800/600`, alt: null, order: product.images.length + 1 }]; product.images.push(...imgs); if (!product.image) product.image = imgs[0].url; return ok({ message: 'Images uploaded.', data: imgs }, 201) }
      if (method === 'DELETE') { const ids = body?.image_ids || []; product.images = product.images.filter(i => !ids.includes(i.id)); return ok({ message: `${ids.length} images deleted.` }) }
    } else {
      const imageId = parseInt(s3)
      const img     = product.images.find(i => i.id === imageId)
      if (!img) return error(404)
      if (method === 'GET')    return ok(img)
      if (method === 'PUT')    { Object.assign(img, body); return ok(img) }
      if (method === 'DELETE') { product.images = product.images.filter(i => i.id !== imageId); return ok({ message: 'Image deleted.' }) }
    }
  }

  /* ── PRODUCT IMAGES (flat) ───────────────────────────────── */
  if (s0 === 'product-images') {
    if (s1 === 'upload' || s1 === 'upload-single') {
      const bodyData  = body instanceof FormData ? Object.fromEntries(body.entries()) : body
      const pid       = parseInt(bodyData.product_id)
      const product   = state.products.find(p => p.id === pid)
      if (product) {
        if (!product.images) product.images = []
        const imgs = [{ id: nextId(), product_id: pid, url: `https://picsum.photos/seed/img-${state.nextId}/800/600`, alt: null, order: product.images.length + 1 }]
        product.images.push(...imgs)
        if (!product.image) product.image = imgs[0].url
        return ok({ message: 'Images uploaded.', data: imgs }, 201)
      }
    }
    if (s1 === 'delete-multiple' && method === 'DELETE') {
      const ids = body?.image_ids || []
      state.products.forEach(p => { if (p.images) p.images = p.images.filter(i => !ids.includes(i.id)) })
      return ok({ message: `${ids.length} images deleted.` })
    }
    const imageId = parseInt(s1)
    for (const p of state.products) {
      if (!p.images) continue
      const img = p.images.find(i => i.id === imageId)
      if (img) {
        if (method === 'GET')    return ok(img)
        if (method === 'PUT')    { Object.assign(img, body); return ok(img) }
        if (method === 'DELETE') { p.images = p.images.filter(i => i.id !== imageId); return ok({ message: 'Image deleted.' }) }
      }
    }
    return error(404)
  }

  /* ── ORDERS ──────────────────────────────────────────────── */
  if (s0 === 'orders') {
    if (!s1) {
      if (method === 'GET')  { let list = [...state.orders]; if (params.status) list = list.filter(o => o.status === params.status); return ok(paginate(list, params)) }
      if (method === 'POST') { const order = { id: nextId(), user_id: state.currentUser?.id, status: 'pending', subtotal: body.subtotal || 0, shipping_cost: 50, total: (body.subtotal || 0) + 50, shipping_address: body.shipping_address, payment_method: body.payment_method, items: body.items || [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; state.orders.push(order); return ok({ message: 'Order placed successfully.', data: order }, 201) }
    }
    const id    = parseInt(s1)
    const order = state.orders.find(o => o.id === id)
    if (!order) return error(404)
    if (method === 'GET')    return ok(order)
    if (method === 'PUT')    { Object.assign(order, { ...body, updated_at: new Date().toISOString() }); return ok({ message: 'Order updated.', data: order }) }
    if (method === 'DELETE') { state.orders = state.orders.filter(o => o.id !== id); return ok({ message: 'Order deleted.' }) }
  }

  /* ── RENTALS ─────────────────────────────────────────────── */
  if (s0 === 'rentals') {
    if (!s1) {
      if (method === 'GET')  { let list = [...state.rentals]; if (params.status) list = list.filter(r => r.status === params.status); return ok(paginate(list, params)) }
      if (method === 'POST') { const prod = state.products.find(p => p.id === parseInt(body.product_id)); const days = Math.max(1, Math.ceil((new Date(body.end_date) - new Date(body.start_date)) / 86400000)); const rental = { id: nextId(), user_id: state.currentUser?.id, product_id: parseInt(body.product_id), product: prod ? { id: prod.id, name: prod.name, image: prod.image } : null, start_date: body.start_date, end_date: body.end_date, total_price: (prod?.daily_rental_price || 0) * days, daily_price: prod?.daily_rental_price || 0, status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; state.rentals.push(rental); return ok({ message: 'Rental created.', data: rental }, 201) }
    }
    const id     = parseInt(s1)
    const rental = state.rentals.find(r => r.id === id)
    if (!rental) return error(404)
    if (method === 'GET')    return ok(rental)
    if (method === 'PUT')    { Object.assign(rental, { ...body, updated_at: new Date().toISOString() }); return ok({ message: 'Rental updated.', data: rental }) }
    if (method === 'DELETE') { state.rentals = state.rentals.filter(r => r.id !== id); return ok({ message: 'Rental deleted.' }) }
  }

  /* ── REVIEWS ─────────────────────────────────────────────── */
  if (s0 === 'reviews') {
    if (!s1) {
      if (method === 'GET')  { let list = [...state.reviews]; if (params.product_id) list = list.filter(r => r.product_id === parseInt(params.product_id)); if (params.user_id) list = list.filter(r => r.user_id === parseInt(params.user_id)); return ok(paginate(list, params)) }
      if (method === 'POST') { const review = { id: nextId(), user_id: state.currentUser?.id, user: { id: state.currentUser?.id, name: state.currentUser?.name }, ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; state.reviews.push(review); return ok({ message: 'Review submitted.', data: review }, 201) }
    }
    const id     = parseInt(s1)
    const review = state.reviews.find(r => r.id === id)
    if (!review) return error(404)
    if (method === 'GET')    return ok(review)
    if (method === 'PUT')    { Object.assign(review, body); return ok(review) }
    if (method === 'DELETE') { state.reviews = state.reviews.filter(r => r.id !== id); return ok({ message: 'Review deleted.' }) }
  }

  /* ── PAYMENTS ────────────────────────────────────────────── */
  if (s0 === 'payments') {
    if (!s1) {
      if (method === 'GET')  return ok(paginate(state.payments, params))
      if (method === 'POST') { const payment = { id: nextId(), ...body, status: 'paid', transaction_id: `TXN-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; state.payments.push(payment); return ok({ message: 'Payment recorded.', data: payment }, 201) }
    }
    const id      = parseInt(s1)
    const payment = state.payments.find(p => p.id === id)
    if (!payment) return error(404)
    if (method === 'GET')    return ok(payment)
    if (method === 'PUT')    { Object.assign(payment, body); return ok(payment) }
    if (method === 'DELETE') { state.payments = state.payments.filter(p => p.id !== id); return ok({ message: 'Payment deleted.' }) }
  }

  /* ── CART ────────────────────────────────────────────────── */
  if (s0 === 'cart') {
    // clear endpoint: DELETE /cart/clear/{userId}
    if (s1 === 'clear' && method === 'DELETE') { state.cartItems = []; state.cartRentals = []; return ok({ message: 'Cart cleared.' }) }

    if (!s1) {
      if (method === 'GET') {
        const subtotal = [...state.cartItems, ...state.cartRentals].reduce((s, i) => s + (i.price || 0), 0)
        return ok({ items: state.cartItems, rental_items: state.cartRentals, subtotal, total: subtotal })
      }
      if (method === 'POST') {
        if (body.type === 'rental') {
          const prod = state.products.find(p => p.id === parseInt(body.product_id))
          const days = Math.max(1, Math.ceil((new Date(body.end_date) - new Date(body.start_date)) / 86400000))
          const item = { id: nextId(), product_id: parseInt(body.product_id), product: prod || null, start_date: body.start_date, end_date: body.end_date, days, price: (prod?.daily_rental_price || 0) * days, type: 'rental' }
          state.cartRentals.push(item)
          return ok({ message: 'Rental added to cart.', item }, 201)
        }
        const prod     = state.products.find(p => p.id === parseInt(body.product_id))
        const existing = state.cartItems.find(i => i.product_id === parseInt(body.product_id))
        if (existing) { existing.quantity += (parseInt(body.quantity) || 1); existing.price = (prod?.price || 0) * existing.quantity; return ok({ message: 'Cart updated.', item: existing }) }
        const item = { id: nextId(), product_id: parseInt(body.product_id), product: prod || null, quantity: parseInt(body.quantity) || 1, price: prod?.price || 0, type: 'purchase' }
        state.cartItems.push(item)
        return ok({ message: 'Item added.', item }, 201)
      }
      if (method === 'DELETE') { state.cartItems = []; state.cartRentals = []; return ok({ message: 'Cart cleared.' }) }
    }
    const id       = parseInt(s1)
    const allItems = [...state.cartItems, ...state.cartRentals]
    const item     = allItems.find(i => i.id === id)
    if (!item) return error(404)
    if (method === 'PUT')    { Object.assign(item, body); if (body.quantity && item.product) item.price = item.product.price * body.quantity; return ok({ message: 'Cart updated.', item }) }
    if (method === 'DELETE') { state.cartItems = state.cartItems.filter(i => i.id !== id); state.cartRentals = state.cartRentals.filter(i => i.id !== id); return ok({ message: 'Item removed.' }) }
  }

  /* ── WISHLIST ────────────────────────────────────────────── */
  if (s0 === 'wishlist') {
    if (s1 === 'check' && method === 'GET') {
      const pid  = params.product_id ? parseInt(params.product_id) : parseInt(s2)
      const wItem = state.wishlist.find(w => w.product_id === pid)
      return ok({ in_wishlist: !!wItem, wishlist_item_id: wItem?.id || null })
    }
    if (s1 === 'clear' && method === 'DELETE') { state.wishlist = []; return ok({ message: 'Wishlist cleared.' }) }
    if (!s1) {
      if (method === 'GET')  return ok({ data: state.wishlist, total: state.wishlist.length })
      if (method === 'POST') {
        if (state.wishlist.find(w => w.product_id === parseInt(body.product_id))) return ok({ message: 'Already in wishlist.' })
        const prod = state.products.find(p => p.id === parseInt(body.product_id))
        const wItem = { id: nextId(), user_id: state.currentUser?.id, product_id: parseInt(body.product_id), product: prod || null, created_at: new Date().toISOString() }
        state.wishlist.push(wItem)
        return ok({ message: 'Added to wishlist.', item: wItem }, 201)
      }
      if (method === 'DELETE') { state.wishlist = []; return ok({ message: 'Wishlist cleared.' }) }
    }
    const id = parseInt(s1)
    if (method === 'DELETE') { state.wishlist = state.wishlist.filter(w => w.id !== id); return ok({ message: 'Removed from wishlist.' }) }
  }

  /* ── RECOMMENDATIONS ─────────────────────────────────────── */
  if (s0 === 'recommendations') {
    if (!s1) return ok({ data: state.recommendations })
    const rec = state.recommendations.find(r => r.id === parseInt(s1))
    return rec ? ok(rec) : error(404)
  }

  /* ── AI endpoints (stubs) ────────────────────────────────── */
  if (s0 === 'ai') {
    if (s1 === 'trending') return ok({ products: state.products.slice(0, 4) })
    if (s1 === 'explore')  return ok({ products: [...state.products].sort(() => Math.random() - 0.5).slice(0, 4) })
    if (s1 === 'similar')  return ok({ products: state.products.filter(p => p.id !== parseInt(s2)).slice(0, 4) })
    if (s1 === 'assistant') {
      const q = (params.query || '').toLowerCase()
      const products = state.products.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).slice(0, 4)
      return ok({ answer: `Here are some results for "${params.query || q}".`, products })
    }
  }

  /* ── LOGS ────────────────────────────────────────────────── */
  if (s0 === 'logs') {
    let list = [...state.logs]
    if (params.action)      list = list.filter(l => l.action      === params.action)
    if (params.entity_type) list = list.filter(l => l.entity_type === params.entity_type)
    if (params.entity_id)   list = list.filter(l => String(l.entity_id) === String(params.entity_id))
    if (params.status)      list = list.filter(l => l.status      === params.status)
    return ok(paginate(list, params))
  }

  /* ── NOTIFICATIONS ───────────────────────────────────────── */
  if (s0 === 'notifications') {
    if (s1 === 'unread-count') return ok({ unread_count: state.notifications.filter(n => !n.read_at).length })
    if (s1 === 'read-all' && method === 'PUT') { state.notifications.forEach(n => { if (!n.read_at) n.read_at = new Date().toISOString() }); return ok({ message: 'All marked as read.' }) }
    if (!s1) return ok({ data: state.notifications, unread_count: state.notifications.filter(n => !n.read_at).length })
    if (s2 === 'read' && method === 'PUT') { const notif = state.notifications.find(n => n.id === s1); if (notif) notif.read_at = new Date().toISOString(); return ok({ message: 'Marked as read.', id: s1, read_at: new Date().toISOString() }) }
  }

  console.warn(`[Mock] Unhandled: ${method} /${segments.join('/')}`)
  return error(404, `Mock: no handler for ${method} /${segments.join('/')}`)
}

function error(status = 500, messageOrData = 'Server error') {
  const data = typeof messageOrData === 'string' ? { message: messageOrData } : messageOrData
  const err  = Object.assign(new Error(data.message || 'Error'), { response: { data, status, statusText: 'Error', headers: {}, config: {} } })
  throw err
}

// ── Custom axios adapter ──────────────────────────────────────────────
export function createMockAdapter() {
  return async function mockAdapter(config) {
    await randomDelay()

    const method   = (config.method || 'GET').toUpperCase()
    const baseUrl  = config.url || ''

    // ✅ KEY FIX: axios puts GET params in config.params, NOT in the URL string.
    // We must merge them into the URL so parseUrl() can read them for filtering/sorting.
    const configParams = config.params || {}
    const queryParts   = Object.entries(configParams)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)

    // Preserve any query string already baked into the URL (edge cases)
    const [urlBase, existingQs] = baseUrl.split('?')
    if (existingQs) queryParts.push(existingQs)

    const url = queryParts.length ? `${urlBase}?${queryParts.join('&')}` : urlBase

    // Body: handle both JSON strings and FormData
    let body = {}
    if (config.data) {
      if (typeof config.data === 'string') {
        try { body = JSON.parse(config.data) } catch (_) { body = {} }
      } else if (config.data instanceof FormData) {
        body = config.data  // pass FormData directly; handlers use instanceof check
      } else {
        body = config.data
      }
    }

    if (import.meta.env.DEV) {
      console.log(`%c[Mock] %c${method} %c${url}`, 'color:#c9a96e;font-weight:bold', 'color:#3498db;font-weight:bold', 'color:#aaa')
    }

    return handle(method, url, body)
  }
}

if (typeof window !== 'undefined') {
  window.__tasleemMockState = state
}
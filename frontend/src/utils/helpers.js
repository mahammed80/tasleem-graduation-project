// Shared helpers — money/date formatting + the Laravel-contract quirks the
// whole app has to handle (envelope unwrapping, id field names, image URLs,
// and the C2C escrow order/rental status vocabulary).

// ── Response envelope ─────────────────────────────────────────
// List endpoints put the array in `data.data`; single ones in `data`.
export function unwrap(res) {
  const d = res?.data
  return d?.data !== undefined ? d.data : d
}
export function unwrapList(res) {
  const v = unwrap(res)
  if (Array.isArray(v)) return v
  if (Array.isArray(v?.data)) return v.data
  return []
}
export function pagination(res) {
  return res?.data?.pagination || {}
}

// ── Money / dates ─────────────────────────────────────────────
export function formatPrice(v, max = 2) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency', currency: 'EGP', maximumFractionDigits: max,
  }).format(Number(v) || 0)
}
export function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
}
export function formatDateTime(d) {
  return d ? new Date(d).toLocaleString('en-EG', { dateStyle: 'medium', timeStyle: 'short' }) : ''
}

// ── Field mapping (Laravel resources differ from scalar ids) ──
export const orderId   = o => o?.order_id  ?? o?.id
export const rentalId  = r => r?.rental_id ?? r?.id
export const productId = p => p?.id ?? p?.product_id

// Some uploads wrongly prepend "<host>/storage/" to an already-absolute URL.
// Also upgrade remote http→https (Railway serves images over https and 301s
// http) so images aren't blocked as mixed content on an https deploy.
export function fixImageUrl(url) {
  let u = String(url ?? '')
  const i = u.indexOf('/storage/')
  if (i !== -1) {
    const after = u.slice(i + '/storage/'.length)
    if (after.startsWith('http://') || after.startsWith('https://')) u = after
  }
  if (u.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(u)) {
    u = 'https://' + u.slice('http://'.length)
  }
  return u
}
export function productImage(p) {
  if (!p) return ''
  const imgs = p.images || []
  const first = imgs[0]
  // Laravel exposes nested images as `image_url`; some resources (e.g. the
  // wishlist's nested product) expose a single top-level `image`/`image_url`.
  return fixImageUrl(
    p.image || p.image_url || p.primary_image ||
    first?.image_url || first?.url || first?.image ||
    (typeof first === 'string' ? first : '') || ''
  )
}

// ── Tasleem (admin store) vs C2C (user) ───────────────────────
export const isAdminOwned = owner => (owner?.role === 'admin')
export const isTasleemOrder = o => isAdminOwned(o?.product?.owner)

// ── Boost ─────────────────────────────────────────────────────
export function isBoosted(p) {
  if (!(p?.is_boosted === true || p?.is_boosted === 1)) return false
  if (p.boost_expires_at && new Date(p.boost_expires_at) < new Date()) return false
  return (p.status ?? '1') === '1'
}
// Float actively-boosted listings to the top (stable within each group).
export function boostedFirst(list) {
  const arr = list || []
  return [...arr.filter(isBoosted), ...arr.filter(p => !isBoosted(p))]
}

// Hide the signed-in user's OWN listings from marketplace feeds.
export function hideMine(list, meId) {
  if (!meId) return list || []
  return (list || []).filter(p => (p.owner?.id ?? p.owner_id) !== meId)
}

// ── Escrow ORDER status (pending → confirmed → delivered) ─────
export function orderStatusLabel(s) {
  return ({
    pending:   'Awaiting seller',
    confirmed: 'Confirmed — in progress',
    shipped:   'On the way',
    delivered: 'Completed',
    cancelled: 'Cancelled',
    returned:  'Returned',
  })[s] || s || 'pending'
}
export function orderStatusBadge(s) {
  return ({
    pending:   'bg-warning text-dark',
    confirmed: 'bg-info text-dark',
    shipped:   'badge-gold',
    delivered: 'bg-success',
    cancelled: 'bg-danger',
    returned:  'bg-danger',
  })[s] || 'bg-secondary'
}
// 3-step escrow timeline index: Placed → Confirmed → Completed.
export function orderStepIndex(s) {
  if (s === 'pending') return 0
  if (s === 'confirmed' || s === 'shipped') return 1
  if (s === 'delivered') return 2
  return 0
}
export const isOrderCancelled = s => s === 'cancelled' || s === 'returned'
export const isOrderCompleted = s => s === 'delivered'

// ── Rental status (pending → confirmed → completed) ───────────
export function rentalStatusLabel(s) {
  return ({
    pending:   'Awaiting owner',
    confirmed: 'Confirmed — in progress',
    active:    'Confirmed — in progress',
    completed: 'Completed',
    returned:  'Completed',
    delivered: 'Completed',
    cancelled: 'Cancelled',
  })[s] || s || 'pending'
}

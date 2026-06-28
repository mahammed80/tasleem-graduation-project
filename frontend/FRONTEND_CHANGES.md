# Tasleem Frontend — C2C / Escrow parity changes

Brings the Vue frontend to feature parity with the Flutter app + the live backend
(the C2C trusted-middleman escrow marketplace). Design (navy + gold) kept as-is.
Builds clean (`npm run build`).

## New API surface — `src/services/api.js`
- `walletService` (get balance + transactions, top-up)
- `offerService` (received/sent, make, accept, reject)
- `boostService` (boost a listing)
- `adminService.stats()` (`GET /admin/stats`)
- `notificationService` — made **real** (was stubbed)
- `orderService` — escrow actions `sellerConfirm` / `complete` / `cancel`
  (cancel now `POST /orders/{id}/cancel` → refund + relist, was a wrong `PUT`)

## New shared helpers — `src/utils/helpers.js`
Envelope unwrap, `order_id`/`rental_id` mapping, `/storage/` image-URL fix,
escrow order/rental status vocabulary (pending→confirmed→delivered), money/date format.

## New stores
- `src/stores/wallet.js`, `src/stores/offers.js`
- `src/stores/notifications.js` — reads real `{ notifications, unread_count }`
- `src/stores/auth.js` — `isSeller` now = any signed-in user (C2C: everyone can sell)

## New / rewritten views
- **`wallet/WalletView.vue`** (new) — balance, top-up, transactions with source labels
- **`offers/OffersView.vue`** (new) — received/sent, accept→order, reject
- **`seller/MySalesView.vue`** (new) — orders on my listings
- **`orders/OrderDetailView.vue`** (rewritten) — escrow: buyer/seller/admin roles,
  Confirm / Mark-Completed-pay-seller / Cancel, earnings (with "Free" promo),
  payment + protection, admin buyer⇄seller + address, 3-step timeline
- **`orders/OrdersView.vue`** (rewritten) — escrow status vocab, per-product cards,
  `user_id` scoping, cancel via the refund endpoint
- **`products/ProductDetailView.vue`** — Make Offer (C2C, for-sale) + Boost (owner)
- **`CheckoutView.vue`** — Wallet/COD payment, per-item escrow orders, delivery = N×30,
  saves delivery address to profile
- **`admin/AdminDashboardView.vue`** — `/admin/stats`: exact KPIs + revenue breakdown + by-source split
- **`auth/RegisterView.vue`** — National ID field (required, immutable note)
- **`profile/ProfileView.vue`** — wallet balance, masked National ID, free-sales banner, quick links

## Routes / nav
- `+/wallet`, `+/offers`, `+/seller/sales` (router + navbar dropdown)

## Still backend-blocked (same as Flutter)
- `seller_id` order filter → My Sales → Orders stays empty until the 1-line backend filter ships
- Rental escrow incomplete on the backend → rentals limited
- AI: `/ai/*` assumes Laravel proxies the FastAPI service; fails gracefully if not

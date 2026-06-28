<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-tag text-gold me-2"></i>Offers</h1>
        <p class="text-muted mb-0 mt-1" style="font-size:.9rem;">Negotiate prices on marketplace listings.</p>
      </div>
    </div>

    <div class="container py-4">
      <!-- Tabs -->
      <ul class="nav nav-pills gap-2 mb-4">
        <li class="nav-item">
          <button class="nav-link" :class="{ active: tab==='received' }" @click="tab='received'">
            Received <span class="badge bg-secondary ms-1" v-if="offers.received.length">{{ offers.received.length }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: tab==='sent' }" @click="tab='sent'">
            Sent <span class="badge bg-secondary ms-1" v-if="offers.sent.length">{{ offers.sent.length }}</span>
          </button>
        </li>
      </ul>

      <LoadingSpinner v-if="offers.loading" height="200px" />

      <template v-else>
        <!-- RECEIVED -->
        <div v-if="tab==='received'">
          <div v-if="offers.received.length === 0" class="empty">
            <i class="bi bi-inbox"></i><p>No offers on your listings yet.</p>
          </div>
          <div v-else class="d-flex flex-column gap-3">
            <div v-for="o in offers.received" :key="o.id" class="card p-3">
              <div class="d-flex align-items-center gap-3">
                <img v-if="img(o)" :src="img(o)" class="thumb" />
                <div v-else class="thumb d-flex align-items-center justify-content-center"><i class="bi bi-image text-muted"></i></div>
                <div class="flex-grow-1 min-w-0">
                  <RouterLink :to="`/products/${o.product?.id}`" class="text-cream fw-600 text-decoration-none d-block text-truncate">{{ o.product?.name || 'Product' }}</RouterLink>
                  <div class="text-muted" style="font-size:.78rem;">From {{ o.buyer?.name || 'Buyer #' + (o.buyer_id || '') }} <TrustBadge :user="o.buyer" compact /></div>
                  <div class="text-muted" style="font-size:.76rem;">Your listed price: {{ formatPrice(o.product?.price) }} · Pays by {{ o.payment_method === 'cash' ? 'COD' : 'Wallet' }}</div>
                </div>
                <div class="text-end">
                  <div class="text-gold fw-800" style="font-size:1.1rem;">{{ formatPrice(o.amount) }}</div>
                  <span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span>
                </div>
              </div>
              <div v-if="o.status === 'pending'" class="d-flex gap-2 mt-3">
                <button class="btn btn-gold btn-sm flex-grow-1" @click="accept(o)" :disabled="busy === o.id">
                  <span class="spinner-border spinner-border-sm me-1" v-if="busy === o.id"></span>Accept
                </button>
                <button class="btn btn-outline-danger btn-sm flex-grow-1" @click="reject(o)" :disabled="busy === o.id">Decline</button>
              </div>
            </div>
          </div>
        </div>

        <!-- SENT -->
        <div v-else>
          <div v-if="offers.sent.length === 0" class="empty">
            <i class="bi bi-send"></i><p>You haven't made any offers yet.</p>
          </div>
          <div v-else class="d-flex flex-column gap-3">
            <div v-for="o in offers.sent" :key="o.id" class="card p-3">
              <div class="d-flex align-items-center gap-3">
                <img v-if="img(o)" :src="img(o)" class="thumb" />
                <div v-else class="thumb d-flex align-items-center justify-content-center"><i class="bi bi-image text-muted"></i></div>
                <div class="flex-grow-1 min-w-0">
                  <RouterLink :to="`/products/${o.product?.id}`" class="text-cream fw-600 text-decoration-none d-block text-truncate">{{ o.product?.name || 'Product' }}</RouterLink>
                  <div class="text-muted" style="font-size:.78rem;">to {{ o.seller?.name || o.product?.owner?.name || 'Seller' }} <TrustBadge :user="o.seller || o.product?.owner" compact /></div>
                  <div class="text-muted" style="font-size:.76rem;">Pay by {{ o.payment_method === 'cash' ? 'COD' : 'Wallet' }}</div>
                </div>
                <div class="text-end">
                  <div class="text-gold fw-800" style="font-size:1.1rem;">{{ formatPrice(o.amount) }}</div>
                  <span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useOffersStore } from '@/stores/offers'
import { formatPrice, productImage, orderId } from '@/utils/helpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import TrustBadge from '@/components/ui/TrustBadge.vue'

const offers = useOffersStore()
const router = useRouter()
const toast = useToast()
const tab = ref('received')
const busy = ref(null)

const img = o => productImage(o.product)
function statusBadge(s) {
  return ({ pending: 'bg-warning text-dark', accepted: 'bg-success', rejected: 'bg-danger', cancelled: 'bg-secondary' })[s] || 'bg-secondary'
}

async function accept(o) {
  busy.value = o.id
  try {
    const res = await offers.accept(o.id)
    const oid = orderId(res?.data?.data?.order || res?.data?.order)
    toast.success('Offer accepted — order created')
    if (oid) router.push(`/orders/${oid}`)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Could not accept offer')
  } finally { busy.value = null }
}
async function reject(o) {
  busy.value = o.id
  try { await offers.reject(o.id); toast.info('Offer declined') }
  catch (_) { toast.error('Could not decline offer') }
  finally { busy.value = null }
}

onMounted(() => offers.fetchAll())
</script>

<style scoped>
.thumb { width:60px; height:60px; border-radius:.7rem; object-fit:cover; background:var(--navy-light); flex-shrink:0; }
.empty { text-align:center; padding:3rem 1rem; color:var(--text-muted); }
.empty i { font-size:2.4rem; display:block; margin-bottom:.6rem; }
.nav-pills .nav-link { color:var(--text-muted); background:var(--navy-light); border:1px solid var(--navy-border); }
.nav-pills .nav-link.active { background:var(--gold); color:var(--navy); border-color:var(--gold); }
</style>

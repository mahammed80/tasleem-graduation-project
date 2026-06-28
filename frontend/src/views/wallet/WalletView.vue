<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-wallet2 text-gold me-2"></i>My Wallet</h1>
        <p class="text-muted mb-0 mt-1" style="font-size:.9rem;">Your simulated balance — used to pay for orders and receive payouts.</p>
      </div>
    </div>

    <div class="container py-4">
      <div class="row g-4">
        <!-- Balance card -->
        <div class="col-lg-5">
          <div class="card p-4 balance-card">
            <div class="text-muted mb-1" style="font-size:.85rem;"><i class="bi bi-wallet2 me-2"></i>Available balance</div>
            <div class="text-gold fw-800" style="font-size:2.2rem;line-height:1.1;">{{ formatPrice(wallet.balance) }}</div>
            <button class="btn btn-gold w-100 mt-3" @click="showTopup = true">
              <i class="bi bi-plus-circle me-2"></i>Add Funds
            </button>
            <p class="text-muted mt-2 mb-0 text-center" style="font-size:.72rem;">Simulated top-up — no real payment.</p>
          </div>
        </div>

        <!-- Transactions -->
        <div class="col-lg-7">
          <div class="card p-4">
            <h6 class="text-cream mb-3">Transactions</h6>
            <LoadingSpinner v-if="wallet.loading" height="180px" />
            <div v-else-if="!wallet.available" class="text-muted text-center py-4" style="font-size:.9rem;">
              <i class="bi bi-cloud-slash d-block mb-2" style="font-size:1.5rem;"></i>
              Wallet service unavailable right now.
            </div>
            <div v-else-if="wallet.transactions.length === 0" class="text-muted text-center py-4" style="font-size:.9rem;">
              No transactions yet. Add funds to get started.
            </div>
            <div v-else class="d-flex flex-column gap-2">
              <div v-for="t in wallet.transactions" :key="t.id"
                class="d-flex align-items-center gap-3 tx-row">
                <div class="tx-icon" :class="isCredit(t) ? 'credit' : 'debit'">
                  <i :class="isCredit(t) ? 'bi bi-arrow-down-left' : 'bi bi-arrow-up-right'"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                  <div class="text-cream fw-500" style="font-size:.86rem;">{{ sourceLabel(t) }}</div>
                  <div class="text-muted" style="font-size:.74rem;">{{ formatDateTime(t.created_at) }}</div>
                </div>
                <div class="text-end">
                  <div class="fw-700" :class="isCredit(t) ? 'text-success' : 'text-danger'" style="font-size:.9rem;">
                    {{ isCredit(t) ? '+' : '-' }}{{ formatPrice(Math.abs(Number(t.amount)), 0) }}
                  </div>
                  <div class="text-muted" style="font-size:.7rem;">Bal {{ formatPrice(Number(t.balance_after), 0) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top-up modal -->
    <Transition name="fade">
      <div v-if="showTopup" class="modal-overlay" @click.self="showTopup = false">
        <div class="card p-4" style="max-width:380px;width:100%;border-radius:1.25rem;">
          <h5 class="text-cream mb-1">Add Funds</h5>
          <p class="text-muted mb-3" style="font-size:.82rem;">Simulated top-up — no real payment.</p>
          <input v-model="amount" type="number" class="form-control mb-3" placeholder="Amount (EGP)" min="1" />
          <div class="d-flex gap-2">
            <button class="btn btn-gold w-100" @click="doTopup" :disabled="topping || !(amount > 0)">
              <span class="spinner-border spinner-border-sm me-2" v-if="topping"></span>Add
            </button>
            <button class="btn btn-outline-gold w-100" @click="showTopup = false">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useWalletStore } from '@/stores/wallet'
import { formatPrice, formatDateTime } from '@/utils/helpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const wallet = useWalletStore()
const toast = useToast()
const showTopup = ref(false)
const amount = ref(5000)
const topping = ref(false)

function isCredit(t) { return Number(t.amount) >= 0 }

function sourceLabel(t) {
  const ref = (t.ref_id && t.ref_id !== 0)
    ? ` · ${({ offer: 'Offer', rental: 'Rental', boost: 'Listing' })[t.ref_type] || 'Order'} #${t.ref_id}`
    : ''
  return ({
    topup:     'Wallet top-up',
    hold:      'Held for your purchase' + ref,
    release:   'Payment for your sale' + ref,
    payout:    'Sale payout' + ref,
    refund:    'Refund' + ref,
    boost_fee: 'Listing boost fee' + ref,
  })[t.type] || (t.description || 'Transaction')
}

async function doTopup() {
  topping.value = true
  try {
    await wallet.topup(Number(amount.value))
    toast.success(`Added ${formatPrice(Number(amount.value), 0)}`)
    showTopup.value = false
  } catch (_) {
    toast.error("Wallet top-up isn't available right now.")
  } finally {
    topping.value = false
  }
}

onMounted(() => wallet.fetch())
</script>

<style scoped>
.balance-card { background: linear-gradient(135deg, var(--navy-card), var(--navy-light)); border:1px solid var(--gold); }
.modal-overlay { position: fixed; inset: 0; z-index: 1060; background: rgba(0,0,0,.65);
  display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px); }
.tx-row { padding:.6rem .25rem; border-bottom:1px solid var(--navy-border); }
.tx-row:last-child { border-bottom:none; }
.tx-icon { width:38px; height:38px; border-radius:.7rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.tx-icon.credit { background: rgba(46,204,113,.12); color:#2ecc71; }
.tx-icon.debit  { background: rgba(231,76,60,.12); color:#e74c3c; }
</style>

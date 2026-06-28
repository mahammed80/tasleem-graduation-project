<template>
  <span v-if="tier" class="trust-badge" :class="'tb-' + tier.key" :title="titleText">
    <i :class="tier.icon"></i>
    <span v-if="!compact" class="tb-label">{{ tier.label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

// Simplified tiers: identity (National ID) + a single completed-sales counter.
//   Verified  = has National ID
//   Trusted   = Verified + >= 3 completed sales
//   Top       = Verified + >= 10 completed sales
const TRUSTED_AT = 3
const TOP_AT = 10

const props = defineProps({
  user: { type: Object, default: null },     // the seller/owner object
  compact: { type: Boolean, default: false }, // icon only (for tight spots)
})

const sales = computed(() => Number(props.user?.completed_sales || 0))
const verified = computed(() => {
  const id = props.user?.national_id
  return !!(id && String(id).trim())
})

const tier = computed(() => {
  // The official Tasleem store (admin) has its own "Official" badge.
  if (!props.user || props.user.role === 'admin') return null
  // Sales track record earns Trusted/Top on its own (no National ID required).
  if (sales.value >= TOP_AT)     return { key: 'top',     label: 'Top Seller',     icon: 'bi bi-award-fill' }
  if (sales.value >= TRUSTED_AT) return { key: 'trusted', label: 'Trusted Seller', icon: 'bi bi-star-fill' }
  // Otherwise, the identity (National ID) earns the entry "Verified" mark.
  if (verified.value)            return { key: 'verified', label: 'Verified', icon: 'bi bi-patch-check-fill' }
  return null
})

const titleText = computed(() =>
  tier.value ? `${tier.value.label}${sales.value ? ` · ${sales.value} completed sales` : ''}` : '')
</script>

<style scoped>
.trust-badge { display:inline-flex; align-items:center; gap:4px; font-size:.66rem; font-weight:700;
  padding:2px 7px; border-radius:999px; white-space:nowrap; vertical-align:middle; }
.tb-verified { background: rgba(46,204,113,.15); color:#2ecc71; }
.tb-trusted  { background: rgba(201,169,110,.18); color: var(--gold); }
.tb-top      { background: linear-gradient(135deg, var(--gold), var(--gold-dark)); color: var(--navy); }
.tb-label { line-height:1; }
</style>

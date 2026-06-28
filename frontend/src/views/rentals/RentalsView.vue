<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1 class="text-cream mb-0"><i class="bi bi-clock-history me-2 text-gold"></i>My Rentals</h1>
      </div>
    </div>
    <div class="container py-4">
      <!-- Tabs -->
      <ul class="nav nav-pills mb-4 gap-1">
        <li class="nav-item" v-for="tab in tabs" :key="tab.value">
          <button class="nav-link" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value; fetchRentals(1)">
            {{ tab.label }}
          </button>
        </li>
      </ul>

      <LoadingSpinner v-if="loading" height="300px" text="Loading rentals..." />

      <div v-else-if="rentals.length === 0" class="text-center py-5">
        <i class="bi bi-clock text-muted" style="font-size:3rem;"></i>
        <h5 class="text-muted mt-3">No rentals found</h5>
        <RouterLink class="btn btn-gold mt-2" to="/products?rentable=1">Browse Rentable Items</RouterLink>
      </div>

      <div class="d-flex flex-column gap-3" v-else>
        <div class="card p-4" v-for="rental in rentals" :key="rental.id">
          <div class="d-flex align-items-start gap-3 flex-wrap">
            <div class="rounded-xl overflow-hidden flex-shrink-0" style="width:80px;height:80px;background:var(--navy-light);">
              <img :src="rental.product?.image" style="width:100%;height:100%;object-fit:cover;" v-if="rental.product?.image" />
              <div class="d-flex align-items-center justify-content-center h-100" v-else>
                <i class="bi bi-image text-muted"></i>
              </div>
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <h6 class="text-cream mb-1">{{ rental.product?.name || 'Rental #' + rental.id }}</h6>
                  <div class="d-flex flex-wrap gap-3 text-muted mb-2" style="font-size:.82rem;">
                    <span><i class="bi bi-calendar-event me-1"></i>{{ rental.start_date }}</span>
                    <span><i class="bi bi-calendar-check me-1"></i>{{ rental.end_date }}</span>
                    <span><i class="bi bi-clock me-1"></i>{{ rentalDays(rental) }} day(s)</span>
                  </div>
                  <span class="badge" :class="statusBadge(rental.status)">{{ rental.status || 'active' }}</span>
                </div>
                <div class="text-end">
                  <div class="text-gold fw-700 fs-5">{{ formatPrice(rental.total_price) }}</div>
                  <div class="text-muted" style="font-size:.75rem;">{{ formatPrice(rental.daily_price) }}/day</div>
                </div>
              </div>

              <!-- Actions -->
              <div class="d-flex gap-2 mt-2 flex-wrap">
                <RouterLink v-if="rental.product?.id" :to="`/products/${rental.product.id}`" class="btn btn-sm btn-outline-gold">
                  <i class="bi bi-box-arrow-up-right me-1"></i>View Product
                </RouterLink>
                <!-- Return button: only for active rentals -->
                <button
                  v-if="canReturn(rental.status)"
                  class="btn btn-sm btn-outline-danger"
                  @click="initiateReturn(rental)"
                  :disabled="returningId === rental.id"
                >
                  <span class="spinner-border spinner-border-sm me-1" v-if="returningId === rental.id"></span>
                  <i class="bi bi-arrow-return-left me-1" v-else></i>Return Item
                </button>
                <!-- Extend rental -->
                <button
                  v-if="canExtend(rental.status)"
                  class="btn btn-sm btn-outline-gold"
                  @click="initiateExtend(rental)"
                >
                  <i class="bi bi-calendar-plus me-1"></i>Extend
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchRentals" />
    </div>

    <!-- Return confirm modal -->
    <div class="modal fade" id="returnModal" tabindex="-1" ref="returnModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h6 class="modal-title text-cream"><i class="bi bi-arrow-return-left text-gold me-2"></i>Return Item</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="toReturn">
            <p class="text-muted" style="font-size:.88rem;">
              You are returning <strong class="text-cream">{{ toReturn.product?.name }}</strong>.
            </p>
            <div class="mb-3">
              <label class="form-label">Condition on return</label>
              <select class="form-select" v-model="returnForm.condition">
                <option value="excellent">Excellent — like new</option>
                <option value="good">Good — minor wear</option>
                <option value="fair">Fair — visible wear</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label class="form-label">Notes (optional)</label>
              <textarea class="form-control" v-model="returnForm.notes" rows="2" placeholder="Any notes about the return..."></textarea>
            </div>
          </div>
          <div class="modal-footer border-0 gap-2">
            <button class="btn btn-outline-gold btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-gold btn-sm" @click="confirmReturn" :disabled="returnLoading">
              <span class="spinner-border spinner-border-sm me-1" v-if="returnLoading"></span>
              Confirm Return
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Extend modal -->
    <div class="modal fade" id="extendModal" tabindex="-1" ref="extendModal">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h6 class="modal-title text-cream"><i class="bi bi-calendar-plus text-gold me-2"></i>Extend Rental</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="toExtend">
            <p class="text-muted" style="font-size:.85rem;">Current end date: <strong class="text-cream">{{ toExtend.end_date }}</strong></p>
            <div class="mb-2">
              <label class="form-label">New end date</label>
              <input type="date" class="form-control" v-model="extendDate" :min="toExtend.end_date" />
            </div>
            <div class="text-muted mt-2" style="font-size:.82rem;" v-if="extendCost > 0">
              Additional cost: <span class="text-gold fw-600">{{ formatPrice(extendCost) }}</span>
            </div>
          </div>
          <div class="modal-footer border-0 gap-2">
            <button class="btn btn-outline-gold btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-gold btn-sm" @click="confirmExtend" :disabled="extendLoading || !extendDate">
              <span class="spinner-border spinner-border-sm me-1" v-if="extendLoading"></span>
              Extend Rental
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { rentalService } from '@/services/api'
import { useToast } from 'vue-toastification'
import { Modal } from 'bootstrap'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const toast = useToast()
const rentals = ref([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)
const activeTab = ref('')
const returningId = ref(null)
const returnLoading = ref(false)
const extendLoading = ref(false)
const toReturn = ref(null)
const toExtend = ref(null)
const extendDate = ref('')
const returnForm = reactive({ condition: 'good', notes: '' })
const returnModal = ref(null)
const extendModal = ref(null)
let bsReturnModal = null
let bsExtendModal = null

const tabs = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Returned', value: 'returned' },
  { label: 'Overdue', value: 'overdue' }
]

const extendCost = computed(() => {
  if (!toExtend.value || !extendDate.value) return 0
  const days = Math.ceil((new Date(extendDate.value) - new Date(toExtend.value.end_date)) / 86400000)
  return Math.max(days, 0) * (toExtend.value.daily_price || 0)
})

function formatPrice(v) { return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(v || 0) }
function statusBadge(s) {
  const m = { active: 'bg-success', returned: 'bg-secondary', overdue: 'bg-danger', pending: 'bg-warning text-dark' }
  return m[s] || 'bg-secondary'
}
function rentalDays(r) {
  if (!r.start_date || !r.end_date) return 0
  return Math.max(Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000), 1)
}
function canReturn(status) { return ['active', 'overdue'].includes(status) }
function canExtend(status) { return status === 'active' }

function initiateReturn(rental) {
  toReturn.value = rental
  Object.assign(returnForm, { condition: 'good', notes: '' })
  bsReturnModal = bsReturnModal || new Modal(returnModal.value)
  bsReturnModal.show()
}

async function confirmReturn() {
  returnLoading.value = true
  try {
    await rentalService.update(toReturn.value.id, { status: 'returned', ...returnForm })
    const found = rentals.value.find(r => r.id === toReturn.value.id)
    if (found) found.status = 'returned'
    toast.success('Item returned successfully!')
    bsReturnModal.hide()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to process return')
  } finally { returnLoading.value = false }
}

function initiateExtend(rental) {
  toExtend.value = rental
  extendDate.value = ''
  bsExtendModal = bsExtendModal || new Modal(extendModal.value)
  bsExtendModal.show()
}

async function confirmExtend() {
  if (!extendDate.value) return
  extendLoading.value = true
  try {
    await rentalService.update(toExtend.value.id, { end_date: extendDate.value })
    const found = rentals.value.find(r => r.id === toExtend.value.id)
    if (found) { found.end_date = extendDate.value; found.total_price = (found.total_price || 0) + extendCost.value }
    toast.success('Rental extended successfully!')
    bsExtendModal.hide()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to extend rental')
  } finally { extendLoading.value = false }
}

async function fetchRentals(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const params = { page, per_page: 10 }
    if (activeTab.value) params.status = activeTab.value
    const res = await rentalService.getAll(params)
    rentals.value = res.data?.data || res.data || []
    totalPages.value = res.data?.last_page || 1
  } catch (_) { rentals.value = [] } finally { loading.value = false }
}

onMounted(() => fetchRentals())
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="text-cream mb-0">Products Management</h5>
      <input v-model="search" class="form-control form-control-sm" placeholder="Search products..." style="width:220px;" @input="debouncedFetch" />
    </div>

    <LoadingSpinner v-if="loading" height="200px" />
    <div v-else class="card overflow-hidden">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr><th>Product</th><th>Price</th><th>Stock</th><th>Category</th><th>Rentable</th><th style="width:80px;">Actions</th></tr>
          </thead>
          <tbody>
            <tr v-if="products.length === 0">
              <td colspan="6" class="text-center text-muted py-4">No products found</td>
            </tr>
            <tr v-for="p in products" :key="p.id">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="rounded overflow-hidden flex-shrink-0" style="width:36px;height:36px;background:var(--navy-light);">
                    <img :src="p.image" style="width:100%;height:100%;object-fit:cover;" v-if="p.image" />
                  </div>
                  <RouterLink :to="`/products/${p.id}`" class="text-cream text-decoration-none" style="font-size:.85rem;font-weight:500;">{{ p.name }}</RouterLink>
                </div>
              </td>
              <td class="text-gold fw-700" style="font-size:.85rem;">{{ formatPrice(p.price) }}</td>
              <td :class="p.stock > 0 ? 'text-cream' : 'text-danger'" style="font-size:.85rem;">{{ p.stock }}</td>
              <td class="text-muted" style="font-size:.78rem;">{{ p.category?.name || '—' }}</td>
              <td><i class="bi bi-check-circle-fill text-gold" v-if="p.is_rentable"></i><i class="bi bi-x-circle text-muted" v-else></i></td>
              <td>
                <div class="d-flex gap-1">
                  <RouterLink class="btn btn-sm btn-outline-gold px-2 py-1" :to="`/seller/products/${p.id}/edit`"><i class="bi bi-pencil" style="font-size:.7rem;"></i></RouterLink>
                  <button class="btn btn-sm btn-outline-danger px-2 py-1" @click="del(p)"><i class="bi bi-trash" style="font-size:.7rem;"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Pagination :current-page="currentPage" :total-pages="totalPages" @change="fetchProducts" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { productService } from '@/services/api'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const toast = useToast()
const products = ref([])
const loading = ref(true)
const search = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

function formatPrice(v) { return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(v || 0) }

let dt = null
function debouncedFetch() { clearTimeout(dt); dt = setTimeout(() => fetchProducts(1), 400) }

async function fetchProducts(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const res = await productService.getAll({ page, per_page: 15, search: search.value || undefined })
    products.value = res.data?.data || res.data || []
    totalPages.value = res.data?.last_page || 1
  } catch (_) { products.value = [] } finally { loading.value = false }
}

async function del(p) {
  if (!confirm(`Delete "${p.name}"?`)) return
  try {
    await productService.delete(p.id)
    products.value = products.value.filter(x => x.id !== p.id)
    toast.success('Deleted')
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
}

onMounted(() => fetchProducts())
</script>

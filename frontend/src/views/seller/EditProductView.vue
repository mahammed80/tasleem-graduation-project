<template>
  <div>
    <div class="page-header">
      <div class="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item"><RouterLink to="/seller">Seller Dashboard</RouterLink></li>
            <li class="breadcrumb-item active">Edit Product</li>
          </ol>
        </nav>
        <h1 class="text-cream mb-0"><i class="bi bi-pencil me-2 text-gold"></i>Edit Product</h1>
      </div>
    </div>

    <div class="container py-4">
      <LoadingSpinner v-if="loading" height="300px" text="Loading product..." />
      <div v-else-if="product" class="row g-4">
        <div class="col-lg-8">
          <form @submit.prevent="onSubmit" novalidate>
            <div class="card p-4 mb-4">
              <h5 class="text-cream mb-4"><i class="bi bi-info-circle me-2 text-gold"></i>Basic Information</h5>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Product Name *</label>
                  <input v-model="form.name" class="form-control" :class="{'is-invalid':errors.name}" />
                  <div class="invalid-feedback">{{ errors.name }}</div>
                </div>
                <div class="col-12">
                  <label class="form-label">Description *</label>
                  <textarea v-model="form.description" class="form-control" rows="5" :class="{'is-invalid':errors.description}"></textarea>
                  <div class="invalid-feedback">{{ errors.description }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Category</label>
                  <select v-model="form.category_id" class="form-select">
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Condition</label>
                  <select v-model="form.condition" class="form-select">
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="card p-4 mb-4">
              <h5 class="text-cream mb-4"><i class="bi bi-tag me-2 text-gold"></i>Pricing & Stock</h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Price (EGP)</label>
                  <div class="input-group">
                    <span class="input-group-text">EGP</span>
                    <input v-model="form.price" type="number" min="0" step="0.01" class="form-control" :class="{'is-invalid':errors.price}" />
                  </div>
                  <div class="text-danger" style="font-size:.8rem" v-if="errors.price">{{ errors.price }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Original Price <span class="text-muted">(optional)</span></label>
                  <div class="input-group">
                    <span class="input-group-text">EGP</span>
                    <input v-model="form.old_price" type="number" min="0" step="0.01" class="form-control" />
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Stock</label>
                  <input v-model="form.stock" type="number" min="0" class="form-control" />
                </div>
              </div>
              <div class="mt-4 p-3 rounded-xl" style="background:var(--navy-light);border:1px solid var(--navy-border);">
                <div class="form-check form-switch d-flex align-items-center gap-2">
                  <input class="form-check-input" type="checkbox" role="switch" v-model="form.is_rentable" id="rentable" style="width:2.5rem;height:1.25rem;" />
                  <label class="form-check-label text-cream" for="rentable"><i class="bi bi-clock-history me-2 text-gold"></i>Available for Rental</label>
                </div>
                <div class="mt-3" v-if="form.is_rentable">
                  <label class="form-label">Daily Price (EGP)</label>
                  <div class="input-group" style="max-width:240px;">
                    <span class="input-group-text">EGP/day</span>
                    <input v-model="form.daily_rental_price" type="number" min="0" step="0.01" class="form-control" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Existing images management -->
            <div class="card p-4 mb-4">
              <h5 class="text-cream mb-4"><i class="bi bi-images me-2 text-gold"></i>Images</h5>
              <!-- Current images -->
              <div class="row g-2 mb-3" v-if="existingImages.length">
                <div class="col-4 col-md-3" v-for="img in existingImages" :key="img.id">
                  <div class="position-relative">
                    <img :src="img.url" class="w-100 rounded-xl" style="height:90px;object-fit:cover;" />
                    <button type="button" @click="deleteExistingImage(img)" style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(231,76,60,.9);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;" :disabled="img.deleting">
                      <i class="bi bi-x" style="color:#fff;font-size:.7rem;" v-if="!img.deleting"></i>
                      <span class="spinner-border spinner-border-sm" style="width:.6rem;height:.6rem;" v-else></span>
                    </button>
                  </div>
                </div>
              </div>
              <!-- Add new images -->
              <div class="image-dropzone" @dragover.prevent="dragging=true" @dragleave="dragging=false" @drop.prevent="onDrop" :class="{'drag-over':dragging}">
                <i class="bi bi-plus-circle" style="font-size:1.8rem;color:var(--gold);"></i>
                <p class="text-muted mb-1 mt-2">Add more images</p>
                <label class="btn btn-outline-gold btn-sm cursor-pointer">
                  Browse <input type="file" class="d-none" multiple accept="image/*" @change="onFilePick" />
                </label>
              </div>
              <div class="row g-2 mt-2" v-if="newPreviews.length">
                <div class="col-4 col-md-3" v-for="(img, idx) in newPreviews" :key="idx">
                  <div class="position-relative">
                    <img :src="img.preview" class="w-100 rounded-xl" style="height:90px;object-fit:cover;" />
                    <span class="badge" style="position:absolute;top:4px;left:4px;background:rgba(52,152,219,.9);color:#fff;font-size:.6rem;">New</span>
                    <button type="button" @click="removeNew(idx)" style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(231,76,60,.9);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                      <i class="bi bi-x" style="color:#fff;font-size:.7rem;"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-gold px-5 py-2" :disabled="submitting">
                <span class="spinner-border spinner-border-sm me-2" v-if="submitting"></span>
                <i class="bi bi-check2 me-2" v-else></i>
                {{ submitting ? 'Saving...' : 'Save Changes' }}
              </button>
              <RouterLink class="btn btn-outline-gold px-4" to="/seller">Cancel</RouterLink>
            </div>
          </form>
        </div>

        <div class="col-lg-4">
          <div class="card p-4 sticky-top" style="top:80px;">
            <h6 class="text-cream mb-3">Product Status</h6>
            <div class="d-flex align-items-center gap-2 mb-3">
              <div style="width:10px;height:10px;border-radius:50%;background:#2ecc71;"></div>
              <span class="text-muted" style="font-size:.88rem;">Live & visible to buyers</span>
            </div>
            <div class="text-muted mb-3" style="font-size:.82rem;"><i class="bi bi-eye me-1"></i>{{ product.views_count || 0 }} views</div>
            <hr style="border-color:var(--navy-border);" />
            <button class="btn btn-sm w-100 mb-2" style="background:rgba(231,76,60,.1);color:#e74c3c;border:1px solid rgba(231,76,60,.25);" @click="deleteProduct">
              <i class="bi bi-trash me-2"></i>Delete Product
            </button>
            <RouterLink class="btn btn-outline-gold btn-sm w-100" :to="`/products/${product.id}`">
              <i class="bi bi-eye me-2"></i>View Listing
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService, categoryService, imageService } from '@/services/api'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const product = ref(null)
const categories = ref([])
const existingImages = ref([])
const newPreviews = ref([])
const newFiles = ref([])
const loading = ref(true)
const submitting = ref(false)
const dragging = ref(false)

const form = reactive({ name:'', description:'', category_id:'', condition:'new', price:'', old_price:'', stock:1, is_rentable:false, daily_rental_price:'' })
const errors = reactive({ name:'', description:'', price:'' })

function onFilePick(e) { addFiles(Array.from(e.target.files)) }
function onDrop(e) { dragging.value=false; addFiles(Array.from(e.dataTransfer.files)) }
function addFiles(files) {
  files.forEach(f => {
    if (!f.type.startsWith('image/')) return
    newPreviews.value.push({ preview: URL.createObjectURL(f) })
    newFiles.value.push(f)
  })
}
function removeNew(idx) {
  URL.revokeObjectURL(newPreviews.value[idx].preview)
  newPreviews.value.splice(idx, 1)
  newFiles.value.splice(idx, 1)
}
async function deleteExistingImage(img) {
  img.deleting = true
  try {
    await imageService.delete(img.id)
    existingImages.value = existingImages.value.filter(i => i.id !== img.id)
    toast.success('Image deleted')
  } catch (_) {
    toast.error('Failed to delete image')
    img.deleting = false
  }
}

function validate() {
  Object.keys(errors).forEach(k => errors[k] = '')
  let valid = true
  if (!form.name.trim()) { errors.name = 'Required'; valid = false }
  if (!form.description.trim()) { errors.description = 'Required'; valid = false }
  if (!form.price || Number(form.price) <= 0) { errors.price = 'Enter a valid price'; valid = false }
  return valid
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== null) fd.append(k, typeof v === 'boolean' ? (v ? 1 : 0) : v)
    })
    await productService.update(route.params.id, fd)
    // Upload new images via separate /product-images/upload endpoint
    if (newFiles.value.length > 0) {
      const imgFd = new FormData()
      imgFd.append('product_id', route.params.id)
      newFiles.value.forEach(f => imgFd.append('images[]', f))
      await imageService.upload(imgFd).catch(() => toast.info('Product saved but some images failed to upload'))
    }
    toast.success('Product updated!')
    router.push({ name: 'ProductDetail', params: { id: route.params.id } })
  } catch (err) {
    toast.error(err.response?.data?.message || 'Update failed')
  } finally {
    submitting.value = false
  }
}

async function deleteProduct() {
  if (!confirm('Delete this product? This cannot be undone.')) return
  try {
    await productService.delete(route.params.id)
    toast.success('Product deleted')
    router.push('/seller')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Delete failed')
  }
}

onMounted(async () => {
  try {
    const [prodRes, catRes, imgRes] = await Promise.all([
      productService.getById(route.params.id),
      categoryService.getAll(),
      imageService.getAll(route.params.id).catch(() => ({ data: [] }))
    ])
    product.value = prodRes.data?.data || prodRes.data
    categories.value = catRes.data?.data || catRes.data || []
    existingImages.value = (imgRes.data?.data || imgRes.data || []).map(i => ({ ...i, deleting: false }))
    Object.assign(form, {
      name: product.value.name || '',
      description: product.value.description || '',
      category_id: product.value.category_id || product.value.category?.id || '',
      condition: product.value.condition || 'new',
      price: product.value.price || '',
      old_price: product.value.old_price || '',
      stock: product.value.stock ?? 0,
      is_rentable: !!product.value.is_rentable,
      daily_rental_price: product.value.daily_rental_price || ''
    })
  } catch (_) {
    toast.error('Failed to load product')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.image-dropzone { border: 2px dashed var(--navy-border); border-radius: 1rem; padding: 1.5rem; text-align: center; transition: var(--transition); cursor: pointer; }
.image-dropzone.drag-over { border-color: var(--gold); background: rgba(201,169,110,.05); }
</style>

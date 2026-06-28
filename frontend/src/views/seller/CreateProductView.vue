<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div class="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item"><RouterLink to="/">Home</RouterLink></li>
            <li class="breadcrumb-item"><RouterLink to="/seller">Seller Dashboard</RouterLink></li>
            <li class="breadcrumb-item active">List Product</li>
          </ol>
        </nav>
        <h1 class="text-cream mb-0">List a Product</h1>
      </div>
    </div>

    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <!-- Step 1: Listing Type -->
          <div class="card p-4 mb-4">
            <h5 class="text-cream mb-4"><span class="text-gold me-2">01.</span> Listing Type</h5>
            <div class="row g-3">
              <div class="col-lg-8">
                <div class="row g-3">
                  <div class="col-md-6" v-for="t in listingTypes" :key="t.value">
                    <input type="radio" v-model="form.listingType" :value="t.value" class="d-none" :id="'type-' + t.value" />
                    <label :for="'type-' + t.value" class="listing-type-card w-100 h-100 d-block" :class="{ active: form.listingType === t.value }">
                      <div class="listing-type-icon">
                        <i :class="t.icon"></i>
                      </div>
                      <div class="listing-type-label">{{ t.label }}</div>
                      <div class="listing-type-check" v-if="form.listingType === t.value">
                        <i class="bi bi-check2-circle"></i>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Basic Info -->
          <div class="card p-4 mb-4">
            <h5 class="text-cream mb-4"><span class="text-gold me-2">02.</span> Basic Info</h5>
            <div class="row g-3">
              <div class="col-md-8">
                <!-- Product Name -->
                <div class="form-group row mb-3">
                  <label class="col-md-4 col-form-label">Product Name <span class="text-danger">*</span></label>
                  <div class="col-md-8">
                    <input class="form-control" v-model="form.name" :class="{ 'is-invalid': errors.name }"
                           placeholder="e.g. iPhone 14 Pro Max 256GB" maxlength="150" />
                    <div class="invalid-feedback">{{ errors.name }}</div>
                    <div class="text-muted mt-1" style="font-size:.75rem;">{{ form.name?.length || 0 }}/150</div>
                  </div>
                </div>

                <!-- Description -->
                <div class="form-group row mb-3">
                  <label class="col-md-4 col-form-label">Description <span class="text-danger">*</span></label>
                  <div class="col-md-8">
                    <textarea class="form-control" v-model="form.description" :class="{ 'is-invalid': errors.description }"
                              rows="5" placeholder="Describe condition, features, included accessories..."></textarea>
                    <div class="invalid-feedback">{{ errors.description }}</div>
                    <div class="text-muted mt-1" style="font-size:.75rem;">{{ form.description?.length || 0 }}/2000</div>
                  </div>
                </div>

                <!-- Category - FIXED -->
                <div class="form-group row mb-3">
                  <label class="col-md-4 col-form-label">Category <span class="text-danger">*</span></label>
                  <div class="col-md-8">
                    <select class="form-select" v-model="form.category_id" :class="{ 'is-invalid': errors.category_id }">
                      <option value="">Select a category</option>
                      <!-- FIX: Use category_id instead of id -->
                      <option v-for="c in categories" :key="c.category_id" :value="c.category_id">{{ c.name }}</option>
                    </select>
                    <div class="invalid-feedback">{{ errors.category_id }}</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Step 3: Pricing & Inventory -->
          <div class="card p-4 mb-4">
            <h5 class="text-cream mb-4"><span class="text-gold me-2">03.</span> Pricing & Inventory</h5>
            <div class="row g-3">
              <div class="col-md-8">
                <!-- Price (or Daily Rate for rentals) -->
                <div class="form-group row mb-3">
                  <label class="col-md-4 col-form-label">{{ showRentFields ? 'Daily Rate (EGP/day)' : 'Sale Price (EGP)' }} <span class="text-danger">*</span></label>
                  <div class="col-md-8">
                    <div class="input-group">
                      <span class="input-group-text">EGP</span>
                      <input class="form-control" type="number" v-model="form.price"
                             :class="{ 'is-invalid': errors.price }" min="0" step="0.01"
                             placeholder="0.00" />
                    </div>
                    <div class="invalid-feedback">{{ errors.price }}</div>
                  </div>
                </div>

                <!-- Quantity -->
                <div class="form-group row mb-3">
                  <label class="col-md-4 col-form-label">Quantity <span class="text-danger">*</span></label>
                  <div class="col-md-8">
                    <input class="form-control" type="number" v-model="form.quantity"
                           :class="{ 'is-invalid': errors.quantity }" min="1" placeholder="1" />
                    <div class="invalid-feedback">{{ errors.quantity }}</div>
                  </div>
                </div>

                <!-- Status -->
                <div class="form-group row mb-3">
                  <label class="col-md-4 col-form-label">Status</label>
                  <div class="col-md-8">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" v-model="form.isActive" id="statusSwitch" />
                      <label class="form-check-label" for="statusSwitch">
                        {{ form.isActive ? 'Active (visible to customers)' : 'Inactive (hidden)' }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Images -->
          <div class="card p-4 mb-4">
            <h5 class="text-cream mb-4"><span class="text-gold me-2">04.</span> Product Images</h5>
            <div class="row g-3">
              <div class="col-md-8">
                <div class="form-group">
                  <label class="form-label">Upload Images (Max 5)</label>
                  <input type="file" class="form-control" multiple accept="image/*" @change="handleImageUpload" :disabled="checkingImage" :class="{ 'is-invalid': errors.images }" />
                  <div class="invalid-feedback">{{ errors.images }}</div>
                  <div class="text-gold mt-1" style="font-size:.75rem;" v-if="checkingImage">
                    <span class="spinner-border spinner-border-sm me-1" style="width:.8rem;height:.8rem;"></span>Checking photo…
                  </div>
                  <div class="text-muted mt-1" style="font-size:.75rem;" v-else>
                    <i class="bi bi-shield-check text-gold me-1"></i>Electronics only — each photo is checked by AI. First image is the cover.
                  </div>
                </div>

                <!-- Image previews -->
                <div class="d-flex flex-wrap gap-2 mt-3" v-if="imagePreviews.length > 0">
                  <div v-for="(img, idx) in imagePreviews" :key="idx" class="position-relative" style="width:80px; height:80px;">
                    <img :src="img" class="w-100 h-100 rounded" style="object-fit:cover;" />
                    <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" style="width:20px; height:20px; padding:0; font-size:.7rem;" @click="removeImage(idx)">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit -->
          <div class="d-flex justify-content-end gap-2">
            <RouterLink to="/seller" class="btn btn-outline-secondary px-4">Cancel</RouterLink>
            <button type="button" class="btn btn-gold px-4" @click="onSubmit" :disabled="submitting">
              <span class="spinner-border spinner-border-sm me-2" v-if="submitting"></span>
              {{ submitting ? 'Publishing...' : 'Publish Product' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productService, categoryService, imageService, aiService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const categories = ref([])
const submitting = ref(false)
const imagePreviews = ref([])
const imageFiles = ref([])
const checkingImage = ref(false) // running the AI electronic-photo check

const listingTypes = [
  { value: 'sale', label: 'For Sale', icon: 'bi bi-tag' },
  { value: 'rental', label: 'For Rent', icon: 'bi bi-clock' },
]

const form = reactive({
  listingType: 'sale',
  name: '',
  description: '',
  category_id: '',
  price: 0,
  quantity: 1,
  isActive: true,
})

const errors = reactive({
  name: '',
  description: '',
  category_id: '',
  price: '',
  quantity: '',
  images: ''
})

const showRentFields = computed(() => {
  return form.listingType === 'rental' || form.listingType === 'both'
})

function validate() {
  Object.keys(errors).forEach(k => errors[k] = '')
  let valid = true

  if (!form.name?.trim()) {
    errors.name = 'Product name is required'
    valid = false
  } else if (form.name.length > 150) {
    errors.name = 'Name must be less than 150 characters'
    valid = false
  }

  if (!form.description?.trim()) {
    errors.description = 'Description is required'
    valid = false
  }

  if (!form.category_id) {
    errors.category_id = 'Please select a category'
    valid = false
  }

  if (!form.price || form.price <= 0) {
    errors.price = 'Valid price is required'
    valid = false
  }

  if (!form.quantity || form.quantity < 1) {
    errors.quantity = 'Quantity must be at least 1'
    valid = false
  }

  return valid
}

async function handleImageUpload(event) {
  let files = Array.from(event.target.files)
  event.target.value = '' // allow re-selecting the same file after a rejection

  const slots = 5 - imageFiles.value.length
  if (slots <= 0) { errors.images = 'Maximum 5 images allowed'; return }
  files = files.slice(0, slots)
  errors.images = ''

  // AI gate: only accept electronic-product photos (fails OPEN if AI is down).
  checkingImage.value = true
  let rejected = 0
  for (const file of files) {
    let accept = true, message = ''
    try {
      const res = await aiService.detectElectronic(file)
      const d = res.data || {}
      accept = d.accept !== false
      message = d.message || ''
    } catch (_) {
      accept = true // fail open
    }
    if (accept) {
      imageFiles.value.push(file)
      const reader = new FileReader()
      reader.onload = (e) => imagePreviews.value.push(e.target.result)
      reader.readAsDataURL(file)
    } else {
      rejected++
      toast.error(message || 'We only accept electronics — that photo was rejected.')
    }
  }
  checkingImage.value = false
  if (rejected > 0 && imageFiles.value.length === 0) {
    errors.images = 'Please upload a clear photo of the electronic item.'
  }
}

function removeImage(index) {
  imageFiles.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

async function onSubmit() {
  if (!validate()) {
    toast.error('Please fix the errors before submitting')
    return
  }

  submitting.value = true

  try {
    // For rentals the `price` field IS the daily rate (matches the app + backend).
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim(),
      category_id: parseInt(form.category_id),
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity),
      status: form.isActive ? 1 : 0,
      type: form.listingType,
      owner_id: auth.user?.id
    }

    // Create the product
    const productRes = await productService.create(payload)
    const productId = productRes.data?.data?.id || productRes.data?.id

    // Upload images (one multipart request, field name images[]).
    if (productId && imageFiles.value.length > 0) {
      const formData = new FormData()
      formData.append('product_id', productId)
      imageFiles.value.forEach(file => formData.append('images[]', file))
      try { await imageService.upload(formData) } catch (_) { /* product still created */ }
    }

    toast.success('Product published successfully!')
    router.push({ name: 'SellerDashboard' })
  } catch (error) {
    console.error('Error creating product:', error)
    
    if (error.response?.data?.errors) {
      // Display validation errors
      Object.entries(error.response.data.errors).forEach(([key, messages]) => {
        if (errors.hasOwnProperty(key)) {
          errors[key] = messages[0]
        }
      })
      toast.error('Please fix the validation errors')
    } else {
      toast.error(error.response?.data?.message || 'Failed to create product')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await categoryService.getAll()
    categories.value = res.data?.data || res.data || []
    
    if (!auth.user?.id) {
      toast.error('Please sign in to list products')
      router.push('/login')
    }
  } catch (error) {
    console.error('Failed to load categories:', error)
    toast.error('Failed to load categories')
  }
})
</script>

<style scoped>
.listing-type-card {
  position: relative;
  padding: 1.5rem;
  border: 2px solid var(--navy-border);
  border-radius: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--navy-light);
}

.listing-type-card:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
}

.listing-type-card.active {
  border-color: var(--gold);
  background: rgba(201, 169, 110, 0.1);
}

.listing-type-icon {
  font-size: 2rem;
  color: var(--gold);
  margin-bottom: 0.5rem;
}

.listing-type-label {
  color: var(--text-main);
  font-weight: 600;
  font-size: 0.9rem;
}

.listing-type-check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: var(--gold);
  font-size: 1.2rem;
}
</style>
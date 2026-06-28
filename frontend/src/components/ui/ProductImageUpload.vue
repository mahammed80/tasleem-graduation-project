<template>
  <div>
    <label class="form-label">Product Images</label>

    <!-- Upload area -->
    <div
      class="upload-area rounded-xl p-4 text-center mb-3"
      :class="{ 'drag-over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="$refs.fileInput.click()"
    >
      <input ref="fileInput" type="file" multiple accept="image/*" class="d-none" @change="onFileSelect" />
      <i class="bi bi-cloud-upload fs-2 text-gold mb-2 d-block"></i>
      <p class="text-cream mb-1" style="font-size:.9rem;">Drag & drop images or <span class="text-gold" style="cursor:pointer;">browse</span></p>
      <p class="text-muted" style="font-size:.78rem;">PNG, JPG, WEBP up to 5MB each. Max {{ maxImages }} images.</p>
    </div>

    <!-- Preview grid -->
    <div class="row g-2" v-if="previews.length > 0">
      <div class="col-4 col-md-3" v-for="(img, i) in previews" :key="i">
        <div class="position-relative rounded-xl overflow-hidden" style="height:100px;background:var(--navy-light);">
          <img :src="img.url" style="width:100%;height:100%;object-fit:cover;" />
          <!-- Primary badge -->
          <span v-if="i === 0" class="position-absolute top-0 start-0 m-1 badge" style="background:var(--gold);color:var(--navy);font-size:.65rem;">Main</span>
          <!-- Upload progress -->
          <div v-if="img.uploading" class="position-absolute inset-0 d-flex align-items-center justify-content-center" style="background:rgba(10,22,40,.7);">
            <div class="spinner-border spinner-border-sm text-gold"></div>
          </div>
          <!-- Error -->
          <div v-if="img.error" class="position-absolute inset-0 d-flex align-items-center justify-content-center" style="background:rgba(231,76,60,.3);">
            <i class="bi bi-exclamation-circle text-danger"></i>
          </div>
          <!-- Remove btn -->
          <button v-if="!img.uploading" type="button" class="position-absolute top-0 end-0 m-1 btn btn-sm p-0" style="width:22px;height:22px;background:rgba(231,76,60,.9);border:none;border-radius:50%;color:white;font-size:.65rem;display:flex;align-items:center;justify-content:center;" @click.stop="removeImage(i)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
      <!-- Add more slot -->
      <div class="col-4 col-md-3" v-if="previews.length < maxImages">
        <div class="rounded-xl d-flex align-items-center justify-content-center cursor-pointer" style="height:100px;background:var(--navy-light);border:2px dashed var(--navy-border);" @click="$refs.fileInput.click()">
          <i class="bi bi-plus-lg text-muted fs-4"></i>
        </div>
      </div>
    </div>

    <!-- Alt text for primary image -->
    <div class="mt-2" v-if="previews.length > 0">
      <label class="form-label" style="font-size:.75rem;">Alt text for main image (SEO)</label>
      <input class="form-control form-control-sm" v-model="altText" placeholder="Describe the main image..." />
    </div>

    <p class="text-danger mt-1" style="font-size:.8rem;" v-if="uploadError">{{ uploadError }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  maxImages: { type: Number, default: 8 }
})

const emit = defineEmits(['update:files'])

const previews = ref([])
const isDragging = ref(false)
const uploadError = ref('')
const altText = ref('')

function onDrop(e) {
  isDragging.value = false
  addFiles(Array.from(e.dataTransfer.files))
}

function onFileSelect(e) {
  addFiles(Array.from(e.target.files))
  e.target.value = ''
}

function addFiles(files) {
  uploadError.value = ''
  const valid = files.filter(f => {
    if (!f.type.startsWith('image/')) { uploadError.value = 'Only image files are allowed'; return false }
    if (f.size > 5 * 1024 * 1024) { uploadError.value = 'Each image must be under 5MB'; return false }
    return true
  })
  const remaining = props.maxImages - previews.value.length
  valid.slice(0, remaining).forEach(file => {
    const url = URL.createObjectURL(file)
    previews.value.push({ url, file, uploading: false, error: false })
  })
  if (valid.length > remaining) {
    uploadError.value = `Maximum ${props.maxImages} images allowed`
  }
  emitFiles()
}

function removeImage(i) {
  URL.revokeObjectURL(previews.value[i].url)
  previews.value.splice(i, 1)
  emitFiles()
}

function emitFiles() {
  emit('update:files', previews.value.map(p => p.file))
}

defineExpose({ previews, altText })
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--navy-border);
  background: var(--navy-light);
  cursor: pointer;
  transition: var(--transition);
}
.upload-area:hover, .upload-area.drag-over {
  border-color: var(--gold);
  background: rgba(201,169,110,.05);
}
.inset-0 { top:0;left:0;right:0;bottom:0; }
</style>

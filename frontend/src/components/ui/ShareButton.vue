<template>
  <div class="position-relative">
    <button class="btn btn-outline-gold btn-sm px-3" @click="toggle" ref="btn">
      <i class="bi bi-share me-1"></i> Share
    </button>

    <Transition name="fade">
      <div v-if="open" class="share-popover card p-3" ref="popover">
        <p class="text-muted mb-2" style="font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;">Share this product</p>
        <div class="d-flex flex-wrap gap-2">
          <a v-for="s in shareOptions" :key="s.label" :href="s.href" target="_blank" rel="noopener noreferrer"
            class="btn btn-sm d-flex align-items-center gap-1" :style="{ background: s.color, color: 'white', border: 'none', fontSize: '.78rem' }"
            @click="open = false">
            <i :class="s.icon"></i> {{ s.label }}
          </a>
        </div>
        <hr class="divider-gold my-2" />
        <div class="d-flex gap-2">
          <input :value="currentUrl" readonly class="form-control form-control-sm" style="font-size:.75rem;" />
          <button class="btn btn-gold btn-sm px-2 flex-shrink-0" @click="copy">
            <i :class="copied ? 'bi bi-check2' : 'bi bi-clipboard'"></i>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: { type: String, default: document.title },
  text: { type: String, default: '' }
})

const open = ref(false)
const copied = ref(false)
const currentUrl = ref(window.location.href)

const shareOptions = computed(() => {
  const url = encodeURIComponent(currentUrl.value)
  const text = encodeURIComponent(props.title)
  return [
    { label: 'WhatsApp', icon: 'bi bi-whatsapp', color: '#25D366', href: `https://wa.me/?text=${text}%20${url}` },
    { label: 'Facebook', icon: 'bi bi-facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { label: 'X', icon: 'bi bi-twitter-x', color: '#000', href: `https://x.com/intent/tweet?url=${url}&text=${text}` },
    { label: 'Telegram', icon: 'bi bi-telegram', color: '#2CA5E0', href: `https://t.me/share/url?url=${url}&text=${text}` }
  ]
})

function toggle() {
  currentUrl.value = window.location.href
  open.value = !open.value
}

async function copy() {
  try {
    await navigator.clipboard.writeText(currentUrl.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (_) {}
}

function clickOutside(e) {
  const el = document.querySelector('.share-popover')
  const btn = document.querySelector('[ref="btn"]')
  if (open.value && el && !el.contains(e.target) && !e.target.closest('button')) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', clickOutside))
onUnmounted(() => document.removeEventListener('click', clickOutside))
</script>

<style scoped>
.share-popover {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 280px;
  z-index: 200;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
}
</style>

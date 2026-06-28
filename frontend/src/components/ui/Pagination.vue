<template>
  <nav v-if="totalPages > 1" class="d-flex justify-content-center mt-4">
    <ul class="pagination">
      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <button class="page-link" @click="emit('change', currentPage - 1)">
          <i class="bi bi-chevron-left"></i>
        </button>
      </li>
      <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === currentPage, disabled: page === '...' }">
        <button class="page-link" @click="page !== '...' && emit('change', page)">{{ page }}</button>
      </li>
      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <button class="page-link" @click="emit('change', currentPage + 1)">
          <i class="bi bi-chevron-right"></i>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})
const emit = defineEmits(['change'])

const visiblePages = computed(() => {
  const pages = []
  const range = 2
  for (let i = 1; i <= props.totalPages; i++) {
    if (i === 1 || i === props.totalPages || (i >= props.currentPage - range && i <= props.currentPage + range)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
})
</script>

<template>
  <div class="d-flex justify-content-center align-items-center py-5" :style="{ minHeight: height }">
    <div class="text-center">
      <div class="spinner-border text-gold" :style="{ width: size, height: size }"></div>
      <p class="text-muted mt-3 mb-0" v-if="text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: '' },
  size: { type: String, default: '2.5rem' },
  height: { type: String, default: '200px' }
})
</script>

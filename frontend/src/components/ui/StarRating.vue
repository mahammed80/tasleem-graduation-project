<template>
  <div class="rating-stars d-inline-flex align-items-center gap-1">
    <template v-for="n in 5" :key="n">
      <i :class="getStarClass(n)"></i>
    </template>
    <span class="text-muted ms-1" style="font-size:.8rem;" v-if="showCount">({{ count }})</span>
  </div>
</template>

<script setup>
const props = defineProps({
  rating: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  showCount: { type: Boolean, default: true }
})

function getStarClass(n) {
  if (n <= Math.floor(props.rating)) return 'bi bi-star-fill filled'
  if (n - props.rating < 1 && n - props.rating > 0) return 'bi bi-star-half filled'
  return 'bi bi-star empty'
}
</script>

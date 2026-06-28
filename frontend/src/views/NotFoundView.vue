<template>
  <div class="d-flex align-items-center justify-content-center" style="min-height:70vh;">
    <div class="text-center">
      <div class="text-gold" style="font-size:8rem; font-weight:800; line-height:1; font-family:'Tajawal',sans-serif;">404</div>
      <h2 class="text-cream mb-3">Page Not Found</h2>
      <p class="text-muted mb-4">The page you're looking for doesn't exist or has been moved.</p>
      <div class="d-flex justify-content-center gap-3">
        <RouterLink class="btn btn-gold px-4" to="/">Go Home</RouterLink>
        <RouterLink class="btn btn-outline-gold px-4" to="/products">Browse Products</RouterLink>
      </div>
    </div>
  </div>
</template>

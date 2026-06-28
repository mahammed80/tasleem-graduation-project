<template>
  <footer class="mt-auto py-5" style="background:#06101e; border-top:1px solid var(--navy-border);">
    <div class="container">
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="navbar-brand mb-3 p-0" style="font-size:2rem; color:var(--cream);">
            تسليم<span style="color:var(--gold);">.</span>
          </div>
          <p class="text-muted" style="max-width:280px;">Your premium marketplace for buying, selling, and renting products with confidence.</p>
          <div class="d-flex gap-2 mt-3">
            <a href="#" class="social-icon"><i class="bi bi-twitter-x"></i></a>
            <a href="#" class="social-icon"><i class="bi bi-instagram"></i></a>
            <a href="#" class="social-icon"><i class="bi bi-facebook"></i></a>
            <a href="#" class="social-icon"><i class="bi bi-linkedin"></i></a>
          </div>
        </div>
        <div class="col-6 col-lg-2 offset-lg-1">
          <h6 class="text-cream mb-3 text-uppercase" style="letter-spacing:.08em; font-size:.8rem;">Marketplace</h6>
          <ul class="list-unstyled">
            <li class="mb-2"><RouterLink class="footer-link" to="/products">All Products</RouterLink></li>
            <li class="mb-2"><RouterLink class="footer-link" to="/categories">Categories</RouterLink></li>
            <li class="mb-2"><RouterLink class="footer-link" to="/rentals">Rentals</RouterLink></li>
          </ul>
        </div>
        <div class="col-6 col-lg-2">
          <h6 class="text-cream mb-3 text-uppercase" style="letter-spacing:.08em; font-size:.8rem;">Account</h6>
          <ul class="list-unstyled">
            <li class="mb-2"><RouterLink class="footer-link" to="/profile">Profile</RouterLink></li>
            <li class="mb-2"><RouterLink class="footer-link" to="/orders">Orders</RouterLink></li>
            <li class="mb-2"><RouterLink class="footer-link" to="/wishlist">Wishlist</RouterLink></li>
          </ul>
        </div>
        <div class="col-12 col-lg-3">
          <h6 class="text-cream mb-3 text-uppercase" style="letter-spacing:.08em; font-size:.8rem;">Stay Updated</h6>
          <p class="text-muted" style="font-size:.85rem;">Get the latest deals in your inbox.</p>
          <form @submit.prevent class="d-flex">
            <input type="email" class="form-control form-control-sm me-1" placeholder="you@email.com" />
            <button class="btn btn-gold btn-sm text-nowrap">Subscribe</button>
          </form>
        </div>
      </div>
      <hr style="border-color:var(--navy-border); margin-top:2.5rem;" />
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        <p class="text-muted mb-0" style="font-size:.82rem;">© {{ year }} Tasleem. All rights reserved.</p>
        <div class="d-flex gap-3">
          <a href="#" class="footer-link" style="font-size:.82rem;">Privacy Policy</a>
          <a href="#" class="footer-link" style="font-size:.82rem;">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.social-icon {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--navy-light); border: 1px solid var(--navy-border);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); text-decoration: none;
  transition: var(--transition);
  &:hover { background: rgba(201,169,110,0.1); border-color: rgba(201,169,110,0.4); color: var(--gold); }
}
.footer-link { color: var(--text-muted); text-decoration: none; font-size: .88rem; transition: var(--transition); &:hover { color: var(--gold); } }
</style>

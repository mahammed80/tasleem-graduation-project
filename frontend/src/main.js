import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import 'bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@fontsource/dm-sans/300.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/tajawal/300.css'
import '@fontsource/tajawal/400.css'
import '@fontsource/tajawal/500.css'
import '@fontsource/tajawal/700.css'
import '@fontsource/tajawal/800.css'
import App from './App.vue'
import router from './router'
import './assets/css/main.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Toast, {
  position: 'bottom-right',
  timeout: 3500,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: false,
  transition: 'Vue-Toastification__fade'
})

app.mount('#app')

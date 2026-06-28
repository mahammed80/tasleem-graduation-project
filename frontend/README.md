# 🛍️ Tasleem Frontend

[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-2-ffd859?logo=pinia)](https://pinia.vuejs.org/)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5-7952b3?logo=bootstrap)](https://getbootstrap.com/)

**Tasleem** is a luxury marketplace frontend built with Vue 3 – enabling users to buy, sell, and rent products across Egypt.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
  - [Mock Data Mode (no backend)](#mock-data-mode-no-backend)
  - [Real Laravel Backend](#real-laravel-backend)
- [🔧 Environment Configuration](#-environment-configuration)
- [👥 Mock Accounts](#-mock-accounts)
- [🗺️ Pages & Routes](#️-pages--routes)
- [📦 Scripts](#-scripts)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)

---

## ✨ Features

- **Authentication** – Login, register, email verification, password reset  
- **Product browsing** – Grid view with filters, search, and detailed product pages  
- **Shopping cart & checkout** – 3-step wizard  
- **Order management** – View orders, cancel items, track history  
- **Rental system** – Manage rentals and return flow  
- **Wishlist** – Save favourite products  
- **Seller dashboard** – Create / edit product listings  
- **Admin panel** – User management and activity logs  
- **Global search** – Instant suggestions  
- **Mock mode** – Fully functional without a backend (purple pill for account switching)

---

## 🚀 Quick Start

### Prerequisites

- Node.js **18+** and npm

### Mock Data Mode (no backend needed)

This mode uses an Axios mock adapter – no real API required.

```bash
npm install
cp .env.mock .env.local   # enables VITE_USE_MOCKS=true
npm run dev               # → http://localhost:3000
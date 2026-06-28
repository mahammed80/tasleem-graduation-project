# Tasleem — Production Deployment (single Ubuntu VPS)

> **Stack on one host, no Docker:** Nginx (reverse proxy) · PHP 8.2 + Laravel (artisan serve, systemd) · Python 3.11 + FastAPI (Gunicorn/Uvicorn, systemd) · SQLite · Vue 3 built into static files.
>
> **Topology**
>
> ```
> Internet → :80 Nginx ──┬── /         → /opt/tasleem/frontend/dist   (static SPA)
>                        ├── /api/…    → 127.0.0.1:8000                (Laravel)
>                        └── /ai/…     → 127.0.0.1:8080                (FastAPI)
> ```

---

## 0. Prerequisites

- Ubuntu 22.04 or 24.04 LTS, fresh.
- `apt` packages: `nginx`, `git`, `unzip`, `curl`, `software-properties-common`, `ca-certificates`, `apt-transport-https`, `ufw`.
- Open inbound ports: `22` (SSH), `80` (HTTP). HTTPS/443 only if you later add a domain.
- Run everything below as a **non-root** user with `sudo` (we'll use `deploy` in the examples).

```bash
sudo apt update && sudo apt upgrade -y
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw --force enable
```

---

## 1. Install runtimes

### 1.1 PHP 8.2 + extensions for Laravel 10

```bash
sudo apt install -y php8.2 php8.2-cli php8.2-fpm php8.2-mbstring \
  php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath php8.2-sqlite3 \
  php8.2-intl php8.2-tokenizer unzip
```

### 1.2 Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 1.3 Node.js 20 (for the frontend build only)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1.4 Python 3.11 + build deps for faiss-cpu

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip \
  build-essential python3.11-dev
```

> The AI service depends on `faiss-cpu` and `ai-edge-litert` (TFLite). Both build/wheel fine on Python 3.11. If `ai-edge-litert` fails, drop the line from `requirements.txt` and the service falls back to `tflite_runtime`/`tensorflow` automatically.

---

## 2. Clone the repo

```bash
sudo mkdir -p /opt/tasleem
sudo chown -R $USER:$USER /opt/tasleem
cd /opt/tasleem
git clone https://github.com/mahammed80/tasleem-graduation-project.git .
git checkout main
```

---

## 3. Backend (Laravel + SQLite)

### 3.1 Configure `.env`

```bash
cd /opt/tasleem/backend
cp .env.example .env
```

Edit `.env` — only these lines need to change from the template:

```dotenv
APP_NAME=Tasleem
APP_ENV=production
APP_DEBUG=false
APP_URL=http://YOUR_VPS_IP

DB_CONNECTION=sqlite
# (Comment out DB_HOST / DB_PORT / DB_DATABASE / DB_USERNAME / DB_PASSWORD
#  or just leave them — they're ignored when DB_CONNECTION=sqlite.)

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
LOG_CHANNEL=stack
LOG_LEVEL=info
```

Create the SQLite file **before** migrating (Laravel doesn't auto-create it):

```bash
touch database/database.sqlite
```

### 3.2 Install + key + migrate + storage

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan storage:link
php artisan migrate --force
php artisan db:seed --force      # only if your seeder is idempotent; skip if unsure
php artisan config:cache
php artisan route:cache
```

### 3.3 systemd unit

Copy the included file:

```bash
sudo cp /opt/tasleem/docs/deploy/tasleem-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tasleem-backend
sudo systemctl status tasleem-backend --no-pager
```

> This runs `php artisan serve` on `127.0.0.1:8000`. It's single-threaded but absolutely fine for a graduation demo. If you later need more throughput, swap it for PHP-FPM + unix socket (the `artisan serve` call goes away; nginx talks to FPM directly).

### 3.4 Sanity check

```bash
curl -s http://127.0.0.1:8000/api/v1/products | head -c 400
```

---

## 4. AI service (FastAPI + Gunicorn)

### 4.1 Virtualenv + deps

```bash
cd /opt/tasleem/ai-service
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```

### 4.2 Environment

```bash
sudo tee /opt/tasleem/ai-service/.env > /dev/null <<'EOF'
# Where the AI service pulls the live catalog from
BACKEND_URL=http://127.0.0.1:8000/api/v1
# Random secret — required by POST /refresh so random people can't trigger resync
REFRESH_TOKEN=CHANGE_ME_TO_A_RANDOM_STRING
# How often (hours) to auto-resync from backend
SYNC_INTERVAL_HOURS=6
# Bind internally only
HOST=127.0.0.1
PORT=8080
EOF
sudo chown root:www-data /opt/tasleem/ai-service/.env
sudo chmod 640 /opt/tasleem/ai-service/.env
```

### 4.3 systemd unit

```bash
sudo cp /opt/tasleem/docs/deploy/tasleem-ai.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tasleem-ai
sudo systemctl status tasleem-ai --no-pager
```

### 4.4 Sanity check

```bash
curl -s http://127.0.0.1:8080/health
# → {"status":"online","products_loaded":...,"electronic_detector":true,...}
```

---

## 5. Frontend (Vue 3 — build static, serve via nginx)

### 5.1 Build

```bash
cd /opt/tasleem/frontend
npm ci                                  # clean install from package-lock.json
# Tell the build where the API lives — relative URL goes through nginx.
cat > .env.production <<'EOF'
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCKS=false
EOF
npm run build                           # outputs to ./dist
```

> We point `VITE_API_BASE_URL` at a **relative** `/api/v1`. The same nginx server then forwards `/api/*` to Laravel — same origin, no CORS issues, and the same setup works whether you access the site by IP or (later) by domain.

### 5.2 Sanity check

```bash
ls -la dist/ | head
# Should show index.html, assets/, favicon.svg, ...
```

---

## 6. Nginx

### 6.1 Server block

```bash
sudo cp /opt/tasleem/docs/deploy/tasleem-nginx.conf /etc/nginx/sites-available/tasleem
sudo ln -sf /etc/nginx/sites-available/tasleem /etc/nginx/sites-enabled/tasleem
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

> The included config uses `/api/` and `/ai/` as internal prefixes — open nginx doesn't expose `:8000` / `:8080` to the internet at all. If you want to add a domain + HTTPS later, run `sudo certbot --nginx -d yourdomain.com` and reload.

### 6.2 End-to-end checks

```bash
# Frontend HTML
curl -sI http://YOUR_VPS_IP/ | head -1
# Backend via nginx
curl -s http://YOUR_VPS_IP/api/v1/categories | head -c 300
# AI service via nginx
curl -s http://YOUR_VPS_IP/ai/health
```

---

## 7. Updates & ops

```bash
cd /opt/tasleem
git pull --rebase origin main

# Backend
cd backend && composer install --no-dev --optimize-autoloader \
  && php artisan migrate --force && php artisan config:cache \
  && sudo systemctl restart tasleem-backend

# AI service
cd ../ai-service && source venv/bin/activate && pip install -r requirements.txt \
  && deactivate && sudo systemctl restart tasleem-ai

# Frontend
cd ../frontend && npm ci && npm run build
# nginx needs no restart — it serves dist/ from disk
```

### Logs

```bash
sudo journalctl -u tasleem-backend -f
sudo journalctl -u tasleem-ai -f
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

### Force-resync the AI catalog

```bash
curl -X POST "http://127.0.0.1:8080/refresh?token=$REFRESH_TOKEN"
```

---

## 8. Adding HTTPS later (optional)

1. Point an A record at `YOUR_VPS_IP`.
2. `sudo apt install -y certbot python3-certbot-nginx`
3. `sudo certbot --nginx -d yourdomain.com`
4. Done. Certbot edits the nginx config and sets up auto-renewal via systemd timer.

---

## 9. Troubleshooting

| Symptom                                            | Fix                                                                                |
|----------------------------------------------------|------------------------------------------------------------------------------------|
| `SQLSTATE[HY000] [2002] No such file or directory` | You didn't `touch database/database.sqlite` before migrating.                      |
| AI service health is `online` but `products_loaded: 0` | Check `BACKEND_URL` in `ai-service/.env` and `curl` it from the box.         |
| Frontend shows blank page                          | Open DevTools → Network. Most likely 404 on `/api/v1/...` → check nginx config.    |
| `artisan serve` is single-threaded                 | Replace the systemd `ExecStart` with a PHP-FPM + nginx block (Laravel docs).       |
| `ai-edge-litert` pip install fails                 | Remove it from `requirements.txt` — main.py falls back to `tflite_runtime` / TF.   |

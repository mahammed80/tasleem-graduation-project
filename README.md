# Tasleem — Graduation Project (Monorepo)

Three independent services, one repo:

| Folder        | Stack                | Default port | Purpose                                  |
|---------------|----------------------|--------------|------------------------------------------|
| `frontend/`   | Vue 3 + Vite         | `5173`       | User-facing web app                      |
| `backend/`    | Laravel 11 (PHP)     | `8000`       | REST API, auth, business logic           |
| `ai-service/` | Python · FastAPI     | `8080`       | Recommendations, search, image detection |

Originally split across three GitHub repos; merged into this monorepo for unified
deployment to a single VPS.

## Layout

```
.
├── frontend/        # Vite + Vue 3 SPA
├── backend/         # Laravel 11 API
├── ai-service/      # FastAPI + scikit-learn / faiss / TF-Lite
├── .gitignore
└── README.md        # ← you are here
```

Each sub-project keeps its own README with component-specific instructions.

## Quick start (local dev)

```bash
# 1) Backend API
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve            # http://127.0.0.1:8000

# 2) AI service
cd ../ai-service
python -m venv venv && source venv/bin/activate   # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080

# 3) Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev                  # http://127.0.0.1:5173
```

The frontend talks to the backend via `VITE_API_BASE_URL`; the backend proxies
heavy ML calls to the AI service.

## Deployment

See **[`docs/DEPLOY.md`](docs/DEPLOY.md)** for the full step-by-step guide.

Short version (Ubuntu 22.04/24.04, single VPS, no Docker):

```bash
# One-time, on the VPS
sudo apt install -y nginx php8.2 php8.2-cli php8.2-fpm php8.2-mbstring \
  php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath php8.2-sqlite3 \
  php8.2-intl php8.2-tokenizer composer nodejs python3.11 python3.venv build-essential

cd /opt && sudo git clone https://github.com/mahammed80/tasleem-graduation-project.git tasleem
cd tasleem

# Backend (SQLite)
cd backend && cp .env.example .env && sed -i 's/DB_CONNECTION=mysql/DB_CONNECTION=sqlite/' .env
touch database/database.sqlite
composer install --no-dev --optimize-autoloader
php artisan key:generate && php artisan storage:link && php artisan migrate --force
sudo cp ../docs/deploy/tasleem-backend.service /etc/systemd/system/
sudo systemctl enable --now tasleem-backend

# AI service
cd ../ai-service && python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt && deactivate
sudo cp ../docs/deploy/tasleem-ai.service /etc/systemd/system/
sudo systemctl enable --now tasleem-ai

# Frontend (build, then nginx serves the dist/)
cd ../frontend && npm ci && npm run build

# Nginx
sudo cp ../docs/deploy/tasleem-nginx.conf /etc/nginx/sites-available/tasleem
sudo ln -sf /etc/nginx/sites-available/tasleem /etc/nginx/sites-enabled/tasleem
sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx
```

After that the site is at `http://YOUR_VPS_IP/`, the API at `/api/v1`, and the AI
service at `/ai/health`.

## License

Proprietary — academic project, all rights reserved by the authors.

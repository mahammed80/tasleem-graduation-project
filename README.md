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

See `docs/DEPLOY.md` (created alongside VPS setup) for the production stack:
nginx + PHP-FPM + Gunicorn/Uvicorn behind a single reverse proxy on the VPS.

## License

Proprietary — academic project, all rights reserved by the authors.

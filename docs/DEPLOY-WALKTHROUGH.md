# VPS Deployment Walkthrough — Tasleem Graduation Project

A real-world, step-by-step record of taking the project from a fresh Ubuntu 24.04
VPS to a working deployment at `http://148.230.118.9/`, including every problem
we hit, how we diagnosed it, and the final fix.

> Companion to [`DEPLOY.md`](DEPLOY.md). Read that first for the happy-path guide;
> read this for the "what if the happy path explodes" guide.

---

## 0. Environment

| Item        | Value                                  |
|-------------|----------------------------------------|
| VPS         | Ubuntu 24.04 LTS                       |
| Public IP   | `148.230.118.9`                        |
| Stack       | Nginx · PHP 8.4 · Python 3.12 · SQLite |
| Repo path   | `/opt/tasleem`                         |
| Pre-existing sites on the box | `araq.ai`, `ashome-eg.com`, `studyhubeg.com` |

The pre-existing sites were the single biggest complication — they had their own
`default_server` blocks and SSL certs, and competed for port 80.

---

## 1. Initial run-through of the documented steps

We followed [`README.md`](../README.md) and [`DEPLOY.md`](DEPLOY.md) almost
verbatim. Sections 1, 2, 3, 6 of `DEPLOY.md` worked as written. Sections 4 and 5
(AI service) failed; the rest needed adjustments because of the multi-tenant
nginx setup. Detailed deviations are below.

---

## 2. Problem: AI service won't start (`python3.11` not found)

**Symptom**

```
Command 'python3.11' not found, but can be installed with:
  apt install python3.11
-bash: venv/bin/activate: No such file or directory
error: externally-managed-environment
```

**Cause**

Ubuntu 24.04 ships with Python 3.12 and no `python3.11` binary. The DEPLOY.md
guide assumes Ubuntu 22.04 (which has 3.11 in `deadsnakes`).

**Fix**

Use the system Python (3.12) and install the `python3-venv` helper package:

```bash
sudo apt install -y python3 python3-venv python3-dev python3-pip build-essential
cd /opt/tasleem/ai-service
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```

`faiss-cpu` and `ai-edge-litert` both have 3.12 wheels, so no further changes
were needed there.

---

## 3. Problem: AI service still won't start (`gunicorn` missing)

**Symptom**

`systemctl status tasleem-ai` → `status=203/EXEC`. The venv existed, the
dependencies were installed, but the venv's `bin/` had no `gunicorn` binary.

**Cause**

`docs/deploy/tasleem-ai.service` runs:

```
ExecStart=/opt/tasleem/ai-service/venv/bin/gunicorn ...
```

But `requirements.txt` did not list `gunicorn` — only `uvicorn`. The systemd
unit was calling a binary that the venv never had.

**Fix (on the VPS)**

```bash
cd /opt/tasleem/ai-service
source venv/bin/activate
pip install gunicorn
deactivate
sudo systemctl restart tasleem-ai
```

**Permanent fix (in the repo)**

```bash
echo "gunicorn" >> /opt/tasleem/ai-service/requirements.txt
```

> Worth flagging in the repo: `requirements.txt` should be the single source of
> truth for runtime deps. The systemd unit shouldn't introduce a dependency
> that isn't pinned there.

---

## 4. Problem: Browser shows a blank page at `http://148.230.118.9/`

**Diagnosis**

```
curl -sI http://127.0.0.1/        # empty response
curl -sI http://148.230.118.9/    # empty response
ss -tlnp | grep :80
# LISTEN 0 511 0.0.0.0:80  users:(("nginx",...))
```

`ss` showed nginx was bound to `:80`, but no request was reaching it.

**Cause**

The VPS shipped with several sites already configured:

```
/etc/nginx/sites-enabled/
├── araq.ai -> /etc/nginx/sites-available/araq.ai
├── ashome-eg.com.conf
├── default.conf       ← had `listen 80 default_server;` with a `return 444` for unknown hosts
├── studyhubeg.com.conf -> ...
└── tasleem -> /etc/nginx/sites-available/tasleem
```

Our `tasleem` config used `listen 80 default_server;`, but `default.conf` was
*also* claiming `default_server` for `:80`. The first-loaded one won, and
requests to the bare IP hit `default.conf`'s `return 444` (close-without-
response), which is exactly why `curl` returned nothing.

**Fix attempt 1 (rejected)**

We deleted `default.conf` and made `tasleem` the new `default_server`. That
worked, but it broke all the other sites on the box (`araq.ai` started being
answered by the Tasleem config).

**Fix attempt 2 (also rejected)**

We bound `tasleem` to `148.230.118.9:80` only and set `server_name 148.230.118.9;`.
Curl kept returning `301 Moved Permanently → https://araq.ai/`. Two more issues
surfaced.

**Final diagnosis (deeper)**

```bash
sudo nginx -T 2>/dev/null | grep -n "148.230"
# → (empty)
```

Our config was never loaded. The reason:

```bash
grep -n "include.*sites-enabled" /etc/nginx/nginx.conf
# 119: include /etc/nginx/sites-enabled/*.conf;
```

The `nginx.conf` globs `*.conf` — but our symlink was named `tasleem` (no
`.conf` suffix). nginx silently skipped it.

We also discovered a stale `tasleem.conf` already existed in `sites-enabled/`
from a previous reload, blocking the new `ln`.

**The fix that worked**

1. Rewrite the IPv6 listen directive. The line we had
   ```nginx
   listen [::]:148.230.118.9:80;
   ```
   is invalid. nginx parsed the IP as a port and errored with
   `invalid port in "[::]:148.230.118.9:80"`. The correct forms are
   `listen [::]:80;` (all IPv6) or `listen [2001:db8::1]:80;` (specific v6).
   We used the all-IPv6 form.

2. Use a real `.conf` filename and write the file directly into
   `sites-enabled/`:

   ```bash
   sudo rm -f /etc/nginx/sites-enabled/tasleem.conf
   sudo tee /etc/nginx/sites-enabled/tasleem.conf > /dev/null <<'EOF'
   server {
       listen 148.230.118.9:80;
       listen [::]:80;
       server_name 148.230.118.9;

       root /opt/tasleem/frontend/dist;
       index index.html;

       location /assets/ {
           access_log off;
           expires 1y;
           add_header Cache-Control "public, max-age=31536000, immutable";
           try_files $uri =404;
       }

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Host              $host;
           proxy_set_header X-Real-IP         $remote_addr;
           proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_read_timeout 60s;
       }

       location /ai/ {
           proxy_pass http://127.0.0.1:8080/;
           proxy_http_version 1.1;
           proxy_set_header Host              $host;
           proxy_set_header X-Real-IP         $remote_addr;
           proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           client_max_body_size 10m;
           proxy_read_timeout 120s;
       }

       location ~ /\. { deny all; }
   }
   EOF

   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. Verify:

   ```bash
   sudo nginx -T 2>/dev/null | grep "148.230"
   # → listen 148.230.118.9:80;
   # → server_name 148.230.118.9;
   ```

**Why bind to a specific IP and not `default_server`?**

Keeping `araq.ai`, `ashome-eg.com`, `studyhubeg.com` working on the same box
required not stealing their `default_server`. Binding to a specific IP is the
cleanest way to coexist.

---

## 5. Problem: API returns 500 (`ALTER TABLE ... MODIFY` on SQLite)

**Symptom**

```
HTTP/1.1 500 Internal Server Error
...near "MODIFY": syntax error...
at /opt/tasleem/backend/database/migrations/2026_06_14_190502_add_fees_to_orders.php(15)
```

**Cause**

The `2026_06_14_190502_add_fees_to_orders` migration runs

```php
DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM(...)");
```

`MODIFY COLUMN` is MySQL syntax. SQLite doesn't support it — it has no `MODIFY`
keyword at all. We never even got past the migration, so the `payments` table
existed but was in a half-built state, and every API call after that crashed.

**Fix**

Guard the MySQL-specific statement by driver. SQLite has no real `ENUM` type
anyway, so we just skip the modification there.

`backend/database/migrations/2026_06_14_190502_add_fees_to_orders.php`:

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('tasleem_fee', 12, 2)->default(0)->after('total_price');
            $table->decimal('delivery_fee', 12, 2)->default(0)->after('tasleem_fee');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('credit_card','paypal','bank_transfer','cash','wallet')");
        }
    }

    public function down(): void {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['tasleem_fee', 'delivery_fee']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('credit_card','paypal','bank_transfer','cash')");
        }
    }
};
```

Then reset and re-migrate:

```bash
cd /opt/tasleem/backend
rm -f database/database.sqlite
touch database/database.sqlite
chmod 664 database/database.sqlite
php artisan migrate:fresh --force
php artisan config:cache
sudo systemctl restart tasleem-backend
```

---

## 6. Problem: API still 500 (storage not writable)

**Symptom**

```
The stream or file "/opt/tasleem/backend/storage/logs/laravel.log" could not be
opened in append mode: Failed to open stream: Permission denied
```

**Cause**

We had run all the previous steps as `root`, so `storage/`, `bootstrap/cache/`
and `database/` were owned by `root:root` with mode `755`. The PHP-FPM /
`artisan serve` processes run as `www-data` and can't write there.

**Fix**

```bash
cd /opt/tasleem/backend
sudo chown -R www-data:www-data storage bootstrap/cache database
sudo chmod -R 775 storage bootstrap/cache database
sudo chmod 664 database/database.sqlite
sudo systemctl restart tasleem-backend
```

**Lesson**

Whenever you bootstrap a Laravel app on a multi-user host, do this chown
*before* the first `artisan migrate`. The first migration writes to
`storage/`, and a failure there is harder to spot than a clean chown at the
start.

---

## 7. Problem: API still 500 (`Database file at path [tasleem] does not exist`)

**Symptom**

```
Database file at path [tasleem] does not exist. Ensure this is an absolute path
to the database. (Connection: sqlite, SQL: PRAGMA foreign_keys = ON;)
```

**Cause**

`backend/.env` had been copied from `.env.example` and `sed -i 's/DB_CONNECTION=mysql/DB_CONNECTION=sqlite/'`
flipped the driver but left the old `DB_DATABASE=tasleem` (the MySQL database
name). SQLite took that value literally as a path.

**Fix**

```bash
cd /opt/tasleem/backend
sudo sed -i 's|^DB_DATABASE=tasleem$|DB_DATABASE=/opt/tasleem/backend/database/database.sqlite|' .env
grep ^DB_ .env
php artisan config:clear
php artisan config:cache
sudo systemctl restart tasleem-backend
```

> Absolute path is more reliable than the Laravel default of `database_path('database.sqlite')`
> because `artisan serve`'s working directory under systemd is not always what
> you expect.

---

## 8. Problem: Browser still redirects to araq.ai (browser cache)

**Symptom**

`curl http://148.230.118.9/` from the VPS returned `200 OK` with the
Tasleem `index.html`, but the browser kept showing araq.ai.

**Cause**

The earlier broken state had caused nginx to return
`301 Moved Permanently → https://araq.ai/`. Browsers cache 301s aggressively —
Chrome stores them in the "force-redirect cache" for as long as it can.

**Fix (on the laptop, not the VPS)**

1. Hard refresh: `Ctrl+Shift+R`
2. Or open an incognito/private window
3. Or DevTools → Network → check "Disable cache"
4. Or clear site data: DevTools → Application → Storage → "Clear site data"
5. Optionally flush DNS: `ipconfig /flushdns`

After that, `http://148.230.118.9/` served the Tasleem frontend correctly.

**Lesson**

When you change a site's `default_server` situation, expect the old redirect to
linger in real users' browsers for the lifetime of their cache. This isn't
something the server can fix — the client has to forget.

---

## 9. Final working state

```text
http://148.230.118.9/            → 200 OK   (Vue SPA, served from /opt/tasleem/frontend/dist)
http://148.230.118.9/api/v1/...  → proxied → 127.0.0.1:8000  (Laravel + SQLite)
http://148.230.118.9/ai/...      → proxied → 127.0.0.1:8080  (FastAPI + Gunicorn)
```

Run-anywhere smoke test:

```bash
curl -sI http://148.230.118.9/                                 # 200
curl -s  http://148.230.118.9/api/v1/categories                 # JSON
curl -s  http://148.230.118.9/ai/health                        # {"status":"online",...}
```

Systemd units:

```bash
sudo systemctl status tasleem-backend --no-pager
sudo systemctl status tasleem-ai      --no-pager
sudo systemctl status nginx           --no-pager
```

---

## 10. Suggested repo changes (so the next deploy is faster)

If you want to spare the next person the same scavenger hunt:

1. **`ai-service/requirements.txt`** — add `gunicorn` (see §3).
2. **`backend/database/migrations/2026_06_14_190502_add_fees_to_orders.php`**
   — guard the `MODIFY COLUMN` statement with `DB::getDriverName() === 'mysql'`
   (see §5). The same check should be added to any other migration that uses
   `MODIFY` or other MySQL-only SQL.
3. **`docs/DEPLOY.md`** — call out:
   - Ubuntu 24.04 has Python 3.12, not 3.11 (use `python3` and install
     `python3-venv`).
   - On multi-tenant hosts, bind the nginx server block to a specific
     `listen <PUBLIC_IP>:80;` and skip `default_server`.
   - The symlink in `sites-enabled/` must end in `.conf` to match the
     `include /etc/nginx/sites-enabled/*.conf;` glob in `nginx.conf`.
   - First-time `chown -R www-data:www-data` on `storage/`, `bootstrap/cache/`,
     `database/` before the first migration.
   - Always set `DB_DATABASE` to an absolute path for SQLite; the
     `sed`-from-MySQL approach leaves junk behind.
4. **`docs/deploy/tasleem-nginx.conf`** — either rename the file to
   `tasleem.conf` so the install step can `ln -sf` it into place correctly,
   or document the `.conf` suffix in DEPLOY.md.

---

## 11. Operational notes

- **Updating the project** after initial deploy:
  ```bash
  cd /opt/tasleem && git pull --rebase
  # backend
  cd backend && composer install --no-dev --optimize-autoloader \
    && php artisan migrate --force && php artisan config:cache \
    && sudo systemctl restart tasleem-backend
  # ai
  cd ../ai-service && source venv/bin/activate \
    && pip install -r requirements.txt && deactivate \
    && sudo systemctl restart tasleem-ai
  # frontend
  cd ../frontend && npm ci && npm run build   # nginx serves dist/ live
  ```
- **Logs**:
  ```bash
  sudo journalctl -u tasleem-backend -f
  sudo journalctl -u tasleem-ai      -f
  sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
  sudo tail -f /opt/tasleem/backend/storage/logs/laravel.log
  ```
- **Resync the AI catalog** (after a backend change):
  ```bash
  curl -X POST "http://127.0.0.1:8080/refresh?token=$REFRESH_TOKEN"
  ```
- **Adding HTTPS later**: point a domain at `148.230.118.9`, then
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d yourdomain.com
  ```
  Certbot will create a new server block on `:443`; just make sure it
  references the same `/opt/tasleem/frontend/dist` root and the same
  `/api/` and `/ai/` proxies.

---

## Appendix: full error → fix index

| # | Error                                                              | Section |
|---|--------------------------------------------------------------------|---------|
| 1 | `python3.11: command not found`                                    | §2      |
| 2 | `error: externally-managed-environment`                             | §2      |
| 3 | AI service `status=203/EXEC`, no `gunicorn`                        | §3      |
| 4 | Browser shows blank page, `curl 127.0.0.1` returns nothing        | §4      |
| 5 | IP redirected to `https://araq.ai/`                                | §4, §8  |
| 6 | Nginx symlink named without `.conf` → silently skipped             | §4      |
| 7 | `invalid port in "[::]:148.230.118.9:80"`                          | §4      |
| 8 | `SQLSTATE[HY000] ... near "MODIFY": syntax error`                  | §5      |
| 9 | `Failed to open stream: Permission denied` (storage/logs)         | §6      |
| 10 | `Database file at path [tasleem] does not exist`                  | §7      |
| 11 | Browser still 301s to araq.ai after fix                           | §8      |

# Deploying Dishaspora to Railway

This runbook has been verified end-to-end: the deployable JAR runs against a real
PostgreSQL database and completes real Paystack checkouts (subscription **and**
food/grocery orders both return genuine `checkout.paystack.com` URLs).

## What you need first

| Thing | Where to get it | Required for |
|-------|-----------------|--------------|
| Railway account | https://railway.app | hosting backend + Postgres |
| Anthropic API key | https://console.anthropic.com | Snap & Cook + AI assistant (everything else works without it) |
| Paystack keys | https://dashboard.paystack.com → Settings → API Keys | payments (test keys are fine to start) |
| (optional) SMTP creds | Resend / Gmail / Mailgun | real verification & password-reset emails |

> Secrets go in Railway **Variables**, never in the repo. `.env`/`.env.*` are git-ignored.

## 1. Deploy the backend

1. Push the repo to GitHub.
2. Railway → **New Project → Deploy from GitHub repo** → select the repo.
3. In the service **Settings**, set **Root Directory = `backend`**.
   Railway auto-detects `backend/Dockerfile` (Java 17) and `backend/railway.json`.
4. Railway → **New → Database → PostgreSQL** (one click).

## 2. Set backend variables

In the **backend service → Variables**:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=<64+ random chars — e.g. `openssl rand -hex 48`>
ANTHROPIC_API_KEY=<sk-ant-...>
PAYSTACK_SECRET_KEY=<sk_test_... or sk_live_...>
PAYSTACK_PUBLIC_KEY=<pk_test_... or pk_live_...>
PAYSTACK_ALLOW_MOCK=false
APP_BASE_URL=https://<your-app>.up.railway.app
```

The `${{Postgres.*}}` values are Railway's own variable references — it fills them in.

### Real email (verification & password-reset links)

The auth flow (register → verify, forgot → reset, change-email) is fully working; to
actually **deliver** those emails you set SMTP env vars. Without them the links are
logged to the server console instead (dev-friendly, nothing to configure).

**Gmail (quickest):** enable 2-Step Verification on the Google account, then create an
**App Password** (Google Account → Security → App passwords). Set:

```
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=you@gmail.com
SPRING_MAIL_PASSWORD=<16-char app password>
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
MAIL_FROM=Dishaspora <you@gmail.com>
AUTH_REQUIRE_VERIFIED_EMAIL=true   # optional: block unverified users at login
```

**Resend / SendGrid / Mailgun** work the same way — use their SMTP host/port/username/
password. Setting `SPRING_MAIL_HOST` is what switches the app from "log" to "send" mode
(a `JavaMailSender` bean auto-configures). No code change needed.

## 3. Generate a domain & deploy

- Railway → backend service → **Settings → Networking → Generate Domain**.
- First boot auto-creates the schema (`ddl-auto: update`) and seeds recipes/vendors/
  listings/demo accounts. Health check: `GET /api/health` → `{"status":"UP"}`.

## 4. Paystack

- With `PAYSTACK_SECRET_KEY` set and `PAYSTACK_ALLOW_MOCK=false`, all payments hit the
  real Paystack API. Checkout opens `checkout.paystack.com` in the app's WebView.
- After payment, Paystack redirects to `${APP_BASE_URL}/api/payments/callback`; the app
  detects it and confirms the purchase.
- (Recommended) In the Paystack dashboard add that same URL as a **webhook**.
- **Test card:** `4084 0840 8408 4081`, any future expiry, CVV `408`, OTP `123456`.

## 5. Point the mobile app at the live backend

In `mobile/.env` (copy from `mobile/.env.example`):

```
EXPO_PUBLIC_API_URL=https://<your-app>.up.railway.app
EXPO_PUBLIC_DEMO_MODE=false
```

Then share the app with others:
- **Expo Go:** `npx expo start` and share the QR (only while your machine's dev server runs).
- **Standalone APK:** `npx eas build -p android --profile preview` → send the `.apk`.

## Local verification (what was tested)

```bash
# real Postgres
brew services start postgresql@16
createuser -s postgres; psql -d postgres -c "ALTER USER postgres PASSWORD 'postgres';"
createdb -O postgres dishaspora

# build + run the deployable jar against Postgres with your keys
cd backend && mvn clean package -DskipTests
PAYSTACK_SECRET_KEY=sk_test_... PAYSTACK_PUBLIC_KEY=pk_test_... PAYSTACK_ALLOW_MOCK=false \
JWT_SECRET=dev-secret APP_BASE_URL=http://localhost:8080 \
java -jar target/dishaspora-backend-1.0.0.jar

curl http://localhost:8080/api/health   # {"status":"UP"}
```

## Notes / known gaps
- **Snap & Cook + AI assistant require `ANTHROPIC_API_KEY`.** Without it they return a
  clear 503 / rule-based fallback — no crash, but not functional.
- Uploaded images go to the container's local `./uploads`, which is **ephemeral** on
  Railway (lost on redeploy). For persistent media, add object storage (S3/Cloudinary).
- No automated test suite yet (Phase 17) — verification here is manual/smoke.

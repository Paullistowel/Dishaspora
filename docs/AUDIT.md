# Dishaspora — Phase 1 Audit Report

_Read-only audit of the monorepo (`backend/`, `mobile/`, `admin-web/`). Generated 2026-07-24._

## 0. Executive summary

Dishaspora is a **Ghanaian/Nigerian recipe + food-marketplace** platform, not a nutrition tracker. It is far more built-out than "mostly broken" — the backend is a clean, well-layered Spring Boot 3.3 / Java 17 modular monolith (98 source files) with working recipes, marketplace, orders, subscriptions, moderation, text-AI assistant and chat. The admin console is a clean live-backend-only React/Vite app. The mobile app is a polished Expo/React Native app.

The real problems are integration and production-readiness, not missing core logic:

1. **The mobile app ships fully mocked** — `DEMO_MODE = true` routes every call to an in-memory fake backend. Nothing is actually integrated end-to-end.
2. **"Snap and Cook" is not a camera feature.** The component named `SnapAndCook` is the guided step-by-step *cook mode* on the recipe screen. **No camera / food-image recognition exists anywhere** in the codebase. Phase 2 is therefore a new build, not a repair.
3. **Deployment is not wired for Railway** — hard-coded port `8080`, hard-coded `localhost` DB, no `Dockerfile`/`railway.json`, no `.env.example`.
4. **Payment mock-mode auto-approves payments** when no Paystack key is set — dangerous if shipped.
5. **Meal planning and calorie tracking do not exist** (Phases 4 & 5 are greenfield).
6. **Auth is core-only** — login/register work; no forgot-password, email verification, refresh tokens, or change-email.
7. **Zero automated tests** across all three apps.

---

## 1. Issue register

Severity: **C**ritical / **H**igh / **M**edium / **L**ow.

| # | Sev | Issue | Cause | Recommended fix | Files |
|---|-----|-------|-------|-----------------|-------|
| 1 | C | App unreachable on Railway | `server.port: 8080` hard-coded; Railway injects dynamic `$PORT` | `server.port: ${PORT:8080}` | `backend/src/main/resources/application.yml:1-2` |
| 2 | C | Publicly-known JWT secret fallback | committed dev default signs tokens if `JWT_SECRET` unset → forgeable admin tokens | require `JWT_SECRET` in prod; fail fast if blank | `application.yml:25` |
| 3 | C | Payment bypass | when `PAYSTACK_SECRET_KEY` blank, `PaystackClient.verify()` returns `true` → premium/orders granted with no payment | disable mock-mode outside dev profile | `backend/.../common/paystack/PaystackClient.java:86-87` |
| 4 | C | Mobile fully mocked | `DEMO_MODE = true`; all calls hit `demoApi` | env-driven flag; default false for real builds | `mobile/src/config.ts:11` |
| 5 | H | Mobile can't reach backend out-of-box | `API_URL` hard-coded to `http://10.0.2.2:8080` (Android-emulator only), not env | drive from `expo-constants`/env; document per-platform | `mobile/src/config.ts:5` |
| 6 | H | DB fails on Railway | datasource hard-coded to `localhost:5432`; Railway `DATABASE_URL` is `postgres://` (not JDBC) | env-driven `SPRING_DATASOURCE_*`; document conversion | `application.yml:7-11` |
| 7 | H | "Snap & Cook" camera feature absent | never built; no `expo-camera`, no vision endpoint | build mobile capture + backend Claude-vision endpoint (Phase 2) | — |
| 8 | H | Silent demo fallback hides outages | any `fetch` throw returns fake data | log + surface real errors; opt-out for critical calls | `mobile/src/api.ts:71-75` |
| 9 | H | CORS fully open | `*` origins, all methods/headers | restrict to known origins in prod | `backend/.../config/SecurityConfig.java:75-84` |
| 10 | H | No forgot-password / email verification | never built | Phases 6/7 | `backend/.../auth/*`, `mobile/app/(auth)/*` |
| 11 | H | JWT in AsyncStorage (plaintext) | not SecureStore/Keychain | migrate to `expo-secure-store` | `mobile/src/context/AuthContext.tsx:82` |
| 12 | H | No image permissions declared | `app.json` lacks camera/photo-library strings; `expo-image-picker` not in plugins | add permission strings + plugin config | `mobile/app.json` |
| 13 | M | No DB migrations | relies on `ddl-auto: update` | add Flyway/Liquibase for prod | `application.yml:14` |
| 14 | M | Uploads on ephemeral disk | `./uploads` lost on redeploy | object storage (S3/Cloudinary) | `backend/.../media/*`, `WebConfig` |
| 15 | M | No health endpoint | no actuator | add `spring-boot-starter-actuator` + `/health` | `backend/pom.xml` |
| 16 | M | Generic 500 leaks internals | handler echoes `ex.getMessage()` | generic message + server-side log | `backend/.../common/exception/GlobalExceptionHandler.java:57-60` |
| 17 | M | No refresh tokens / revocation | 7-day non-revocable JWT | short access + refresh rotation | `backend/.../auth/service/JwtService.java` |
| 18 | M | Admin 401 leaves user "logged in" | client trusts cached user; no 401 handling | clear session + redirect on 401 | `admin-web/src/api/client.ts:44-53` |
| 19 | M | Admin `banned` field mismatch | `banned` not in documented `User` DTO | verify/extend backend response | `admin-web/src/pages/Users.tsx:75-129`, `docs/API.md:15-20` |
| 20 | M | 7-second JS splash on every start | `AnimatedSplash` layered over native splash | shorten; show once | `mobile/src/components/AnimatedSplash.tsx:34` |
| 21 | M | Meal planning / calorie tracking absent | never built | Phases 4/5 (greenfield) | — |
| 22 | M | No avatar removal / compression | only gallery pick + crop | add remove + `expo-image-manipulator` | `mobile/app/edit-profile.tsx` |
| 23 | L | Weak password policy | `@Size(min=6)` only; no lockout/rate-limit | complexity rules + rate limiting | `backend/.../auth/dto/AuthDtos.java:14` |
| 24 | L | Zero tests | none written | add unit/integration/API tests | `backend/src/test` (absent) |
| 25 | L | No `.env.example` | never created | add for all three apps | repo root |
| 26 | L | Default admin password in README | demo convenience | rotate for real deploys | `admin-web/README.md:20-22` |
| 27 | L | Assistant premium gate stale | `gated` derived once at mount | derive from live `user.premium` | `mobile/app/assistant.tsx:59` |

**Corrected note:** an earlier draft flagged the Claude model id `claude-sonnet-5` (`backend/.../ai/service/ClaudeClient.java:21`) as invalid. It is a **valid** current Anthropic model; the text assistant works with a real `ANTHROPIC_API_KEY`. No change needed there.

---

## 2. Per-app notes

### Backend (`backend/`)
- Spring Boot 3.3.5, Java 17. Modules: `auth, recipe, marketplace, order, subscription, admin, ai, chat, media, common, config`.
- Data is **DB-backed and seeded** (`config/seed/*`, runs when users table empty) — not hard-coded controller responses. Only `PlanDto.all()` (subscription tiers) is code-defined.
- Auth: JWT HS256, BCrypt, ban enforcement. Missing: refresh, verification, reset.
- Payments: Paystack fully wired (subscription + order checkout). AI: text-only Claude assistant + rule-based smart search. **No image AI.**

### Mobile (`mobile/`)
- Expo SDK 54, RN 0.81, React 19, expo-router. React Query + Context. No Redux/Zustand.
- Startup gate is correct: splash → onboarding (first launch, `AsyncStorage` `dishaspora.onboarded`) → login → tabs. Onboarding is **not** skipped in code.
- Everything renders from `src/demo/*` while `DEMO_MODE = true`.

### Admin (`admin-web/`)
- React 18 + Vite 5 + React Query. Live-backend only, no mocks, no dead code (strict `tsc` gates build).
- `VITE_API_BASE_URL` env-overridable (default `http://localhost:8080`). JWT in `localStorage`.

---

## 3. What does NOT exist (so is a build, not a fix)
- Camera / food-image recognition ("Snap & Cook" as imagined) — **Phase 2**
- Meal planning (daily/weekly/monthly) — **Phase 4**
- Calorie/macro/water tracking, charts, reports — **Phase 5**
- Forgot-password, email verification, change-email — **Phases 6/7/8**
- `Dockerfile` / `railway.json` / `.env.example` — **Phases 11/15**
- Any automated tests — **Phase 17**

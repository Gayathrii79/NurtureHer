# NurtureHer AI — Audit, Repair & Completion Report

**Scope:** Audit the delivered project against the approved synopsis; find, fix, complete, or
remove missing / broken / dummy / disconnected features; verify end-to-end.
**Out of scope (by instruction):** the chatbot / RAG / Gemini subsystem (owned by another team
member) and the Nutrition content. Neither was modified.
**Environment:** Windows, Python 3.12, SQLite (`nurtureher.db`), Vite/React/TS frontend.
**Date:** 2026-10-08.

---

## 1. Feature Matrix

Legend — **WORKING** = verified end-to-end · **FIXED** = was broken/dummy, now correct ·
**IMPLEMENTED** = previously missing, now built · **EXTERNAL CONFIG** = code complete, needs a
key/worker/credential to run for real · **NOT VERIFIED** = implemented but not executed E2E ·
**DUMMY REMOVED** = fabricated data deleted.

| # | Feature | Area | Status | Evidence / Notes |
|---|---------|------|--------|------------------|
| 1 | Email/password auth (register, login, logout, refresh, forgot/reset/change password) | Backend | WORKING | 5 demo roles log in 200; `/auth/me` returns correct role |
| 2 | Refresh-token rotation without Redis | Backend | FIXED | Rotate fell back to Redis only → forced logout every 30 min. Now DB row is authoritative; replay rejected (401), successor works. Regression test added |
| 3 | Role-based access control (`RoleRoute` + backend deps) | Both | WORKING | Mother navigating to `/admin` is redirected to `/`; 403 from backend for cross-role APIs |
| 4 | EPDS / PPD scoring engine | Backend | FIXED | Was mixing published item scores with invented weighting. Now plain sum of 10 items; HIGH ≥13 or item-10>0; MODERATE ≥10; else LOW. Unit-tested |
| 5 | PPD page + hybrid breakdown (EPDS + sentiment) + anchors | Frontend | WORKING | Renders seeded EPDS 6/30 “low · balanced and peaceful” |
| 6 | PCOS prediction (Random Forest) | Backend | FIXED | Now returns `model_source`; real artifact (`random_forest_pickle`, acc 0.9083, ROC-AUC 0.9346, CV 0.8724). `step="any"` decimal BMI accepted |
| 7 | `GET /pcos/model-info` | Backend | IMPLEMENTED | New; powers the “Model: Random Forest (trained)” banner + metrics |
| 8 | PCOS page result render + XAI factor breakdown | Frontend | FIXED | True engine banner; result panel (0% low, factor contributions) verified live |
| 9 | Wellness PDF health report | Backend+Frontend | IMPLEMENTED | `app/services/pdf_report.py` + `GET /wellness/report/pdf` (own-data only). 12 KB valid `%PDF-1.3`, download button fires 200 |
| 10 | Wellness analytics (mood/symptom/cycle/screening trends) | Both | WORKING | Real aggregates from seeded records (moods 2, symptom 1, cycle Regular, PCOS low · EPDS 6) |
| 11 | Emergency SOS dispatch | Both | FIXED | Was a fake “sent” toast. Now creates real `Alert` rows with truthful status (`queued` / `skipped_no_phone` / `queued_no_worker`) |
| 12 | SMS alert dispatch graceful degradation | Backend | FIXED | `queue_sms_alert` wraps `.delay()`; broker down → `queued_no_worker`, never 500 |
| 13 | Notifications bell | Frontend | FIXED | Was hard-coded badge. Now real endpoint; honest empty state |
| 14 | ASHA high-risk queue + enrichment | Backend | FIXED | Queue now returns mother name/phone/district/village, not bare UUIDs |
| 15 | ASHA filters (risk_level, status, search, district, village, risk_type, worker, paging) | Backend | IMPLEMENTED | Wired; empty state is honest (“No cases match”) |
| 16 | ASHA dashboard + case actions | Frontend | WORKING | Renders live stats; status update (resolve) verified via API/authz tests |
| 17 | Admin dashboard telemetry + real AI Models block | Both | FIXED | Removed fabricated XGBoost/92.4%/DistilRoBERTa. Now shows 5 accounts, 3 screenings, 95 audit events, real engine names |
| 18 | Audit trail | Backend | WORKING | 95 events recorded in seeded run |
| 19 | CareCircle QR TrustVault consent flow | Backend+Frontend | FIXED | `request-access` 500’d (naive vs aware datetime). Fixed; full request→approve→connection→consent-filtered summary verified. Two regression tests added |
| 20 | CareCircle QR shows real signed token (not demo) | Frontend | FIXED | Error state instead of a hard-coded demo token; `/verify-access` consent page renders with token prefilled |
| 21 | HerReach — nearby public health facilities | Frontend (new) | IMPLEMENTED | Nominatim geocode + Overpass 20 km search; real results (RMV Hospital 7.9 km, Manipal 11.6 km w/ phone). Offline/empty/error states |
| 22 | PWA (installable + offline shell) | Frontend (new) | IMPLEMENTED | `manifest.webmanifest`, `sw.js`, `offline.html`, icons; manifest linked; SW registers on PROD build. Artifacts serve 200 |
| 23 | i18n (en, hi, kn, ml, ta, te) | Frontend | WORKING | Keys migrated; Hindi switch renders translated strings |
| 24 | Chatbot / RAG / Gemini | Backend | EXTERNAL CONFIG | **Out of scope** — not modified. Requires `GEMINI_API_KEY` |
| 25 | Twilio / Fast2SMS real SMS delivery | Backend | EXTERNAL CONFIG | Code path complete; needs provider creds + a Celery worker. Falls back truthfully today |
| 26 | Celery + Redis background jobs | Backend | EXTERNAL CONFIG | Redis not running; `SafeRedis` and bounded timeouts keep the app healthy |
| 27 | Caregiver zone / nutrition / cycle tracker | Both | WORKING | Pre-existing functionality, untouched |
| 28 | `frontend/src/data/mock.ts`, `charts/Charts.tsx` | Frontend | DUMMY REMOVED | Dead fabricated-data modules deleted |
| 29 | One-off i18n migration script | Tooling | DUMMY REMOVED | `scripts/_apply_i18n_keys.py` deleted after run |

---

## A. WORKING (verified end-to-end)

- Auth across all five roles: `mother`, `doctor`, `asha`, `caregiver`, `admin` @ `nurtureher.com` /
  `Password123!` → `POST /auth/login` 200 and `GET /auth/me` returns the correct role.
- Role guards: a logged-in mother requesting `/admin` is redirected to `/`; backend returns 403 on
  cross-role APIs (covered by `tests/test_api_authorization.py`).
- Mother dashboard renders real seeded data (Mood: Happy, cycle estimate 2026-10-17, PCOS: Moderate,
  PPD: Low) with zero console errors.
- Reports Zone shows real records (PCOS low 0%, PCOS moderate 57%, EPDS 6/30) and Wellness Analytics
  computed from those records.
- ASHA portal (live stats, honest empty queue), Admin console (5 accounts, 3 screenings, 95 audit
  events), Caregiver zone.
- i18n language switching, dark mode, PWA artifacts served with correct manifest + theme color.

## B. FIXED (were broken or fake, now correct)

1. **PPD/EPDS scoring** — replaced invented weighting with the published 10-item sum and the standard
   HIGH/MODERATE/LOW bands.
2. **Refresh-token rotation without Redis** — DB `refresh_tokens` row is now authoritative; comparison
   of naive (SQLite) vs aware datetimes normalized. Single-use rotation preserved.
3. **PCOS model honesty** — the UI/API now report the actual engine (`random_forest_pickle`) and the
   real artifact metrics instead of a loosely-attributed placeholder.
4. **Emergency SOS** — persists real `Alert` rows and reports the true status; never fabricates “sent”.
5. **SMS dispatch** — broker-unavailable is caught and surfaced as `queued_no_worker`.
6. **CareCircle `request-access` 500** — `TypeError: can't compare offset-naive and offset-aware
   datetimes`. Fixed via a `_as_aware_utc` / `_qr_is_expired` helper; the whole consent flow now works.
7. **ASHA queue identity** — returned only UUIDs; now returns mother name/phone/district/village.
8. **Admin AI Models** — fabricated model names/scores removed; real state rendered.
9. **Seeded demo accounts (this session)** — the `users` table had been corrupted (NULL ids from manual
   `DROP`/recreate). Repaired by a clean re-seed: valid UUID ids, correct role enum values, verified
   password hashes, and re-linked `mother_profiles` (1 linked, 1 total).
10. **Notifications bell / CareCircle demo token** — replaced with real data and error states.

## C. MISSING → IMPLEMENTED

- **HerReach** — new page (`frontend/src/pages/HerReachPage.tsx`): device geolocation with profile fallback,
  Nominatim geocoding, Overpass 20 km facility search, distance sorting, `tel:` and OpenStreetMap links,
  plus offline / empty / error states. Nav entry added; route `/herreach`.
- **`GET /pcos/model-info`** — added.
- **Wellness PDF health report** — `app/services/pdf_report.py` + `GET /wellness/report/pdf`.
- **`POST /wellness/emergency-sos`**, **`PATCH /auth/me`**, **`GET /admin/dashboard` models block**.
- **Verify-access consent page** — `VerifyAccessPage` at `/verify-access?token=…`.
- **PWA layer** — manifest, service worker (same-origin GET only; navigation network-first→shell→
  offline; cache-first `/assets/`; network-first with cache fallback for dashboard/analytics), offline
  page, and icons.
- **Regression tests** — CareCircle consent flow + self/unknown-token rejection.

## D. IMPLEMENTED (built)

Covered above; all IMPLEMENTED items are code-complete and pass typecheck/lint/build and the backend
test suite where applicable.

## E. EXTERNAL CONFIG REQUIRED

- **Real SMS delivery (Twilio / Fast2SMS):** `SMS_PROVIDER=twilio` with empty `TWILIO_*` values, and no
  Celery worker running. The app records the alert and reports `queued_no_worker` / `skipped_no_phone`.
  Supply provider credentials and start a worker to actually send.
- **Celery + Redis:** `REDIS_URL`/broker configured but Redis is not running locally. `SafeRedis` and
  bounded connect/read timeouts keep the app responsive; refresh rotation no longer depends on Redis.
- **Gemini chatbot / RAG:** `GEMINI_API_KEY` empty. **Out of scope** — not modified.
- **bcrypt version drift:** `requirements.txt` pins `bcrypt==4.0.1` but the environment has
  `bcrypt 5.0.0`. `app/core/security.py` uses raw `bcrypt.hashpw`/`checkpw` (with 72-byte truncation),
  so auth works; align the pin or keep the raw-bcrypt approach.

## F. NOT VERIFIED

- **Real device-GPS path in HerReach** — the headless browser has no GPS fix, so verification used the
  profile fallback (Yelahanka, Bengaluru Urban) and returned real OSM facilities. The geolocation branch
  itself was not exercised.
- **PWA offline behaviour in a live browser** — the built artifacts, manifest link, and SW registration
  code were verified (and serve 200); an actual offline reload was not executed.
- **Celery worker execution** of SMS/alerts (no worker/credentials available).
- **Chatbot / RAG / Gemini** — intentionally untouched.

## G. DUMMY REMOVED

- `frontend/src/data/mock.ts` — deleted.
- `frontend/src/components/charts/Charts.tsx` — deleted.
- `frontend/src/pages/AdminDashboard.tsx` — fabricated “XGBoost / 92.4% / DistilRoBERTa” strings removed.
- `frontend/src/components/CareCircleQR.tsx` — hard-coded demo token replaced with a real/error state.
- `scripts/_apply_i18n_keys.py` — one-off migration script removed after use.

## H. FILES CHANGED

Backend
- `app/services/scoring_engine.py` (EPDS/PPD)
- `app/services/notification.py` (graceful dispatch)
- `app/services/token_service.py` (refresh DB fallback + tz normalization)
- `app/core/redis.py` (bounded timeouts)
- `app/api/routes/pcos.py` (model_source, `/model-info`, decimal BMI)
- `app/api/routes/wellness.py` (PDF report, emergency SOS)
- `app/api/routes/admin.py` (real models block)
- `app/api/routes/asha.py` (queue enrichment + filters)
- `app/api/routes/carecircle.py` (naive/aware datetime fix — this session)
- `app/services/pdf_report.py` (new)
- `app/services/health.py`, `app/schemas/health.py`
- `tests/test_api_authorization.py` (new suite + 2 CareCircle regressions — this session)
- `tests/test_ml_enhancements.py`
- `nurtureher.db` (re-seeded cleanly — this session)

Frontend
- `src/lib/api.ts`, `src/App.tsx`, `src/main.tsx`, `src/index.html` (manifest link)
- `src/pages/ClinicalPages.tsx`, `ReportsZone.tsx`, `SupportPages.tsx`, `AdminDashboard.tsx`
- `src/pages/HerReachPage.tsx` (new)
- `src/components/CareCircleQR.tsx`, `src/components/common/...` (as touched)
- `src/layout/Topbar.tsx`, `src/layout/navigation.ts`
- `src/i18n/index.ts`, `translations/*` (+ 6 locales)
- `public/manifest.webmanifest`, `public/sw.js`, `public/offline.html`, `public/icons/*` (new)
- `eslint.config.js`
- Deleted: `src/data/mock.ts`, `src/components/charts/Charts.tsx`

## I. COMMANDS

```bash
# Backend test suite (coverage gate 80%)
cd NurtureHer && python -m pytest tests -p no:cacheprovider -q
#   → 82 passed, coverage 81.01%, exit 0

# Re-seed a clean demo database (repairs demo accounts)
cd NurtureHer && PYTHONPATH=. python scripts/seed.py

# Run backend (port 8001 used locally because an unrelated server holds 8000)
cd NurtureHer && PYTHONPATH=. python -m uvicorn app.main:app --host 127.0.0.1 --port 8001

# Frontend typecheck / lint / build
cd NurtureHer/frontend && npx tsc -p tsconfig.json --noEmit
cd NurtureHer/frontend && npx eslint . --ext ts,tsx --max-warnings 0
cd NurtureHer/frontend && npm run build

# Frontend dev server against the backend
cd NurtureHer/frontend && VITE_API_BASE_URL=http://127.0.0.1:8001 npm run dev
```

Verification results: `tsc` = 0 errors · `eslint --max-warnings 0` = 0 · `npm run build` = success,
with `sw.js`, `manifest.webmanifest`, `offline.html`, `icons/` emitted to `dist/`.

## J. REMAINING WORK

1. **Align `bcrypt`**: either pin the environment to `bcrypt==4.0.1` or bump `requirements.txt` to
   match the installed `bcrypt 5.0.0` and re-verify the hash/verify tests.
2. **Start Redis + a Celery worker** to exercise true SMS dispatch, and add Twilio/Fast2SMS credentials
   to move alerts from `queued_no_worker` to `sent`.
3. **Manual GPS + offline pass** in a real browser to close the two NOT VERIFIED items (HerReach device
   location, PWA offline reload).
4. **Consolidate the datetime normalization** used in `token_service.py` and `carecircle.py` into one
   shared helper (e.g. `app/core/time.py`) to prevent the naive/aware class of bug recurring elsewhere.
5. **Frontend test coverage** — there is currently no component/E2E test runner wired for the React app;
   the backend suite is the primary automated gate.
6. **Confirm demo credentials in the README** match the seed (`Password123!` for all five roles) so the
   1-click demo buttons and the docs stay in sync.

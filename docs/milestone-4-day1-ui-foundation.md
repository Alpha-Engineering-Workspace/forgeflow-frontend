# ForgeFlow — Milestone 4 / Day 1: UI Foundation & Auth Redesign

**Scope:** Frontend-only, based on uploaded `forgeflow-frontend-milestone-3.zip` and `forgeflow-backend-milestone-3.zip` snapshots, 18 October 2026. The ZIP files contain no `.git` history. The owner's **live GitHub main is not verified** by this change set.

## 1. What changed (সহজ বাংলা)

Milestone 3-তে Authentication functional ছিল, কিন্তু Login/Register/Verify/Resend এবং protected Dashboard দেখতে সাধারণ ছিল। এই milestone-এ **UI-এর জিনিসগুলো এক জায়গায় নিয়ম অনুযায়ী রাখা হয়েছে**। Backend JWT, database, Redis, gateway, BFF request payload এবং Auth.js callbacks **অপরিবর্তিত**।

| File(s) | পরিবর্তন ও উদ্দেশ্য |
|---|---|
| `src/app/(auth)/layout.js` | চারটি Auth route-এর shared responsive shell; desktop brand panel এবং mobile simplified header |
| `src/components/auth/auth-card.jsx` | Auth heading, description, eyebrow typography এক জায়গায় |
| `src/app/(auth)/*/page.js` | চার page শুধু নিজের title, description এবং form compose করে |
| `src/components/ui/{field,password-field,inline-alert}.jsx` | consistent label/error, password show/hide, accessible feedback |
| `src/components/ui/{button,input,skeleton,page-header}.jsx` | mobile-friendly controls, skeleton primitive, page heading |
| `src/features/auth/components/*-form.jsx` | **same endpoints** রেখে visual, validation feedback, pending/success/error state উন্নত |
| `src/components/layout/workspace-shell.jsx` | Actual authenticated dashboard sidebar, account menu, mobile modal drawer, unavailable features clearly disabled |
| `src/app/(protected)/dashboard/{page,loading}.js` | Protected session check/sign-out retained; real user name; no invented workspace/projects/metrics |
| `src/app/globals.css` | Original brand tokens preserved; semantic focus/alert/input styles and reduced-motion skeleton |
| `tests/components/{password-field,register-form,verify-email-form}.test.jsx` | New targeted interaction regression tests (added, not yet executed in this sandbox) |

## 2. File-to-file communication

### Login

```text
Browser /login
 → src/app/(auth)/layout.js (common page shell)
 → src/app/(auth)/login/page.js (content)
 → src/features/auth/components/login-form.jsx (form)
 → signIn("credentials") → src/app/api/auth/[...nextauth]/route.js
 → src/auth.js → src/features/auth/server/login-gateway.js
 → Express Gateway → Auth Service → PostgreSQL
 ← Auth issues tokens → Auth.js server stores tokens in Redis
 ← encrypted HttpOnly browser session cookie
 → /dashboard → auth() validation → protected UI
```

`PasswordField` visual state (mask/unmask) browser-এ থাকে; এটি Redis বা JWT access করে না। Input এর `register()`/`handleSubmit()` React Hook Form-এর পুরনো contract।

### Register

```text
/register/page.js → RegisterForm → Zod validation
 → POST /api/backend/auth/register (existing BFF)
 → Gateway → Auth Service → PostgreSQL
 ← 201: account created; show verification instruction
```

HTTP 201 **email delivered** বলছে না। Error হলে name/email/password form-এ থাকে, validation/error message দেখা যায়।

### Verify and Resend

```text
/verify-email?token=... → VerifyEmailForm
    Only on button click: POST /api/backend/auth/email/verify
    204 success → message and Sign in link; URL থেকে one-time token সরায়

/resend-verification → ResendVerificationForm
    POST /api/backend/auth/email/resend
    202 → generic confirmation (account existence or delivery guaranteed নয়)
```

### Dashboard and sign-out

```text
/dashboard/page.js → auth() (server side)
  no valid session → redirect /login
  valid session → WorkspaceShell receives safe {name,email} ONLY
  account menu → server signOutAction → Auth.js signOut
  → existing Redis session invalidation + backend logout attempt
```

Frontend shell intentionally shows **“No workspace yet”** and marks Projects, Issues, Board and Settings **“Soon”** (non-clickable). It does **not** invent workspace membership or tenant data. That arrives in Milestone 5.

## 3. Security and UX invariants

- Frontend owns display/form interaction only; browser gets **no backend access/refresh tokens**.
- Register/verify/resend BFF request routes, headers and formats unchanged.
- Login continues through Auth.js `signIn`, not a new public login API.
- Verify GET never consumes token; explicit POST; old token removed from URL after successful verification.
- Generic resend `202` does not confirm account existence or actual delivery.
- Auth.js protected dashboard redirect and server-side `signOut` path preserved.
- Minimum 44px interactive controls, mobile input text ≥16px, visible focus outlines, reduced-motion support.
- Mobile drawer uses native dialog (`Escape` closes, focus returns to trigger); account menu supports `Escape`.
- Async feedback uses status/alert; no simulated API delay, hardcoded customer data, or real data masquerading as demos.

## 4. Verification and limitations

**Performed in supplied-snapshot environment:** Read both ZIPs and frontend `AGENTS.md`; inspected route/components, Auth.js integration, and backend module/migration inventory. JavaScript/JSX syntax parsed successfully (67 source/test files before this document). Scratch Git `diff --check` passed.

**Not performed:** `npm test`, `npm run lint`, `npm run build`, Docker build, real browser/device manual review, real backend integration, GitHub PR/CI/merge. This environment provides Node 22.16, while repo `.nvmrc` specifies Node 24, and a dependency install failed due to missing offline cached packages. Docker is unavailable. **These are blockers to completion, not passing checks.**

**On user's Windows machine, Git Bash:** First confirm the live checkout has a clean `main` and no unrelated user edits. Create `feat/ui-foundation` from updated main; `git apply --check` the supplied patch and apply only if it matches. Then run `npm ci`, `npm run lint`, `npm test`, `npm run build`, and a Docker build if Docker Desktop is running. Manually check `/login`, `/register`, `/verify-email`, `/resend-verification`, protected `/dashboard` and Sign out at 320–390px, 414px, 768–1024px and desktop widths. Test keyboard, touch, slow/error requests, email verify success/expiry and the real auth backend flow.

**Current M4 status:** Source changes prepared in snapshot; NOT verified on live repository, NOT CI approved, NOT merged, NOT deployed.

## 5. Next workflow

1. Confirm local snapshot matches latest GitHub `main` (do not overwrite unknown changes).
2. Apply on frontend `feat/ui-foundation` branch, review `git diff` and full file paths.
3. Run local tests/build and fix anything found before commit.
4. Push frontend feature branch, open PR → check required CI/Docker build on latest SHA → review → squash merge.
5. Keep backend repo unchanged on Day 1. Start Milestone 5 only after M4 acceptance checks.

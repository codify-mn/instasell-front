# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Facebook Live Commerce admin dashboard for the Mongolian market. Merchants use this to automate order-taking from Facebook Live comments, manage products/orders, accept QPay payments, and stream live video with product overlays.

**Stack:** Nuxt 4 (SPA mode, SSR disabled), Vue 3, TypeScript, @nuxt/ui v4, @nuxt/content, @vueuse/nuxt, Zod, date-fns, driver.js, @unovis/vue (charts), pnpm.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server at http://localhost:3000
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm lint             # ESLint (stylistic: commaDangle 'never', braceStyle '1tbs')
pnpm typecheck        # TypeScript checking (vue-tsc)
```

## Architecture

### Runtime Config

Two backend URLs configured in `nuxt.config.ts` via `runtimeConfig.public`:

- `apiUrl` — Go backend (default `http://localhost:4000`), cookie-based JWT auth
- `srsUrl` — SRS media server (default `http://localhost:1985`), used for WebRTC streaming

Environment variables: `NUXT_PUBLIC_API_URL`, `NUXT_PUBLIC_SRS_URL`

### Layouts

- **`default.vue`** — Dashboard layout with collapsible sidebar, used for all `/dashboard/*` routes
- **`auth.vue`** — Minimal full-screen layout for login/register/OTP
- **`public.vue`** — Marketing pages (landing, pricing, privacy) with AppHeader/AppFooter
- **`docs.vue`** — Documentation pages with sidebar navigation and ToC

### Auth Flow

`app/middleware/auth.global.ts` runs on every route:

- Public pages: `/`, `/login`, `/signup`, `/auth/callback`, `/docs/*`, `/checkout/*`, `/pricing`, `/privacy`, `/forgot-password`, `/reset-password`
- Protected `/dashboard/*` routes redirect to `/login` if unauthenticated
- Redirects to `/onboarding` if `needsOnboarding` is true
- Uses `useAuth()` (shared composable via `createSharedComposable`)

Auth sequence: email/password → OTP email verification (6-digit) → cookie-based JWT sessions.

### Composable Patterns

All composables in `app/composables/` follow:

1. Get `apiUrl` from `useRuntimeConfig().public`
2. Use `$fetch(url, { credentials: 'include' })` for all API calls (cookie auth)
3. Return reactive refs and async methods
4. Show toasts on error: `toast.add({ title: 'Алдаа', description: err.data?.message, color: 'error' })`

Key composables:

- **`useAuth`** — Login, register, OTP, password reset (shared)
- **`useProducts`** — Product/variant CRUD, categories, bulk import/export
- **`useOrders`** — Order management, customer search, checkout
- **`useShop` / `useShopSettings`** — Shop data and settings
- **`useQPay`** — QPay merchant registration, invoice creation, payment verification
- **`useSubscription`** — Plans, billing cycles, usage tracking, invoice history
- **`useWebRTC`** — WebRTC streaming to SRS via WHIP, RTMP forwarding to Facebook
- **`useCanvasStream`** — Canvas overlay compositor (product info on live video, 720x1280 portrait)
- **`useAutomation`** — Facebook comment automation flows
- **`useTour`** — Onboarding tour state (localStorage)
- **`useSKU`** — SKU generation/validation for live commerce
- **`useDashboardData`** — Dashboard stats aggregation
- **`formatter.ts`** — Date/currency formatting (Mongolian Tugrik ₮, no decimals)

### Component Organization

Components in `app/components/` are registered with `pathPrefix: false` (no path-based prefix needed).

Groups:

- `Dashboard*` — Dashboard page cards, stats, greeting, tour, revenue chart
- `Home*` — Analytics charts, date pickers, period selectors
- `Product*` — Product forms, image upload, variant management, bulk import
- `Order*` — Cart, product grid, variant modal
- `Live*` — Live stream comments, stats, product list
- `QPay*` — Merchant forms, invoice modal, status badges
- `Billing*` — Plans grid, payment modal, history table
- `Automation*` — Create modal, list items, flow cards

### Key Domain Concepts

**Facebook Live Commerce:** Users comment keywords/SKUs on Facebook Live → backend parses comments (regex: `[A-Z0-9\-_]{3,50}`) → creates orders automatically. Three automation tones: professional, friendly, playful.

**Live Streaming Pipeline:** Webcam → `useWebRTC` (WHIP to SRS) → `useCanvasStream` (product overlay) → RTMP forward to Facebook. Two overlay layouts: `banner` (top) or `card` (centered).

**QPay (Mongolia):** Merchant registration (company/personal) → invoice creation with QR code → deep links for mobile payment apps → payment verification polling.

**Subscription:** Plans with limits (max_products, max_orders_per_month, max_storage_mb, max_shops). Billing via QPay. Usage tracking with warnings.

### Localization

All UI text is in **Mongolian (Cyrillic)**. Currency is Mongolian Tugrik (₮) formatted without decimals. Keep all user-facing strings in Mongolian.

### Styling

- **Shopify Polaris-inspired theme:** Clean surfaces, professional cards, minimal shadows
- **Primary color:** Deep Green (#008060) — Shopify-inspired, sophisticated
- **Dark mode:** Near-black (#1A1A1A), fully supported
- **Font:** Inter (300–800), loaded via Google Fonts in `main.css`
- **Page/layout transitions** configured in `nuxt.config.ts`
- Card utilities in `main.css`: `.glass-card`, `.glass-card-elevated`, `.glass-nav-active`

### Content

`content.config.ts` defines three collections:

- `index` — Landing page (YAML)
- `pricing` — Pricing page (YAML)
- `docs` — Documentation (Markdown with sidebar nav)

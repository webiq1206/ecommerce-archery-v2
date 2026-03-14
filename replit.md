# Workspace

## Overview

Premium archery e-commerce platform built as a pnpm workspace monorepo using TypeScript. Full-stack with Express 5 API, PostgreSQL/Drizzle ORM, React Vite storefront, and admin panel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Routing**: wouter
- **Build**: esbuild (CJS bundle for API), Vite (for frontend)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 8080)
│   │   └── src/routes/     # 16 route files: products, categories, brands, collections,
│   │                       # orders, customers, reviews, discounts, cart, search,
│   │                       # distributors, fulfillment, content, email, reports, health
│   └── archery-store/      # React Vite storefront + admin panel (port 23340, preview: /)
│       └── src/
│           ├── pages/         # Home, Catalog, ProductDetail, Cart + admin pages
│           ├── components/    # Navbar, Footer, ProductCard + shadcn/ui components
│           └── hooks/         # useSessionStore (zustand)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec (40+ endpoints) + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema (16 schema files) + DB connection
│       └── src/schema/     # enums, users, categories, brands, collections, distributors,
│                           # products, orders, cart, wishlist, addresses, reviews,
│                           # discounts, content, email-subscribers, store-settings
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Design

- **Brand**: Apex Archery — premium outdoor performance
- **Palette**: Charcoal #1A1A1A, Amber-gold #C8922A, Forest green #2C4A2E, Warm surface #F7F6F4
- **Style**: Deep forest meets precision-engineered performance (think Sitka Gear meets REI)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Database Schema

16 schema files covering: users/auth, categories (hierarchical), brands, collections, distributors, products (with variants/images/specs/faqs/tags), orders (with items/refunds/fulfillment_logs), cart, wishlist, addresses, reviews, discounts, content (blog/guides/flat pages), email subscribers, store settings.

Enums: UserRole, ProductStatus, FulfillmentStatus, OrderStatus, PaymentStatus, DiscountType, ContentStatus.

- Push schema: `pnpm --filter @workspace/db run push`
- Force push: `pnpm --filter @workspace/db run push-force`

## API Endpoints (40+)

All under `/api`:
- Products: CRUD + list with filters (category, brand, price, search, sort, featured)
- Categories: CRUD with hierarchical parent/child
- Brands: CRUD with product counts
- Collections: CRUD with product counts
- Orders: CRUD + create from cart items
- Customers: list + detail with order stats
- Reviews: CRUD + moderation
- Discounts: CRUD + validate codes
- Cart: CRUD by session ID
- Search: full-text product search
- Distributors: CRUD
- Fulfillment: trigger + logs
- Content: blog posts CRUD + buying guides CRUD
- Email: subscribe
- Reports: revenue, products, customers

## Important Notes

- Express 5: async handlers need `Promise<void>`, use `res.status().json(); return;` pattern
- Routes must NOT include `/api` prefix (app.ts mounts router at `/api`)
- Array columns: use `.array()` method — `text("tags").array()`
- OpenAPI spec title forced to "Api" by orval config
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
- Seed script: `npx tsx artifacts/api-server/src/seed.ts`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with 16 route modules. Uses `@workspace/api-zod` for validation and `@workspace/db` for persistence.

### `artifacts/archery-store` (`@workspace/archery-store`)

React Vite storefront with:
- Homepage: hero, trust bar, categories, featured products, brand story
- Catalog: sidebar filters, product grid, sorting
- Product detail: image gallery, variants, specs, reviews, add-to-cart
- Cart page
- Admin dashboard, products, and stub admin sections
- Packages: wouter, zustand, framer-motion, recharts, lucide-react, clsx, tailwind-merge, date-fns

### `lib/db` (`@workspace/db`)

Database layer with 16 Drizzle schema files covering all e-commerce entities.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec with 40+ endpoints. Codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.

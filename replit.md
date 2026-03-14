# Workspace

## Overview

Premium archery e-commerce platform ("Apex Archery") built as a pnpm workspace monorepo using TypeScript. Full-stack Next.js 15 App Router application with Server Components for SSR/SEO, PostgreSQL/Drizzle ORM, and admin panel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Framework**: Next.js 15 (App Router with Server Components)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Styling**: Tailwind CSS v4 (postcss plugin, no config file)
- **Icons**: lucide-react
- **Fonts**: Oswald (headings/display), Barlow (body)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   └── archery-store/      # Next.js 15 App Router (port 23340, preview: /)
│       ├── app/
│       │   ├── page.tsx           # Homepage (SSR, featured products)
│       │   ├── layout.tsx         # Root layout with Navbar + Footer
│       │   ├── products/
│       │   │   ├── page.tsx       # Catalog (SSR, filters, sort)
│       │   │   └── [slug]/page.tsx # Product detail (SSR, generateMetadata)
│       │   ├── search/page.tsx    # Full-text search (SSR, tsvector)
│       │   ├── cart/page.tsx      # Cart (client component)
│       │   ├── account/page.tsx   # Account placeholder
│       │   ├── admin/
│       │   │   ├── layout.tsx     # Admin sidebar layout
│       │   │   ├── page.tsx       # Dashboard with stats
│       │   │   ├── products/      # Products CRUD
│       │   │   ├── orders/        # Orders list
│       │   │   ├── customers/     # Customer aggregation
│       │   │   ├── distributors/  # Distributor cards
│       │   │   └── fulfillment/   # Fulfillment logs
│       │   └── api/               # Next.js Route Handlers
│       │       ├── health/        # Health check
│       │       ├── products/      # Products CRUD + [id]
│       │       ├── categories/    # Categories list
│       │       ├── brands/        # Brands list
│       │       ├── cart/          # Cart CRUD (session-based)
│       │       ├── orders/        # Orders CRUD + [id]
│       │       ├── checkout/      # Stripe payment intent (stub if no key)
│       │       ├── search/        # Full-text search API
│       │       ├── reviews/       # Reviews CRUD
│       │       └── wishlist/      # Wishlist CRUD
│       ├── components/            # Navbar, Footer, ProductCard, AddToCartButton, SearchForm
│       ├── lib/utils.ts           # cn(), formatPrice()
│       ├── middleware.ts          # Admin route guard (stub)
│       ├── next.config.ts
│       ├── postcss.config.mjs
│       └── tsconfig.json
├── lib/
│   ├── db/                 # Drizzle ORM schema (16 schema files) + DB connection
│   │   └── src/schema/     # enums, users, categories, brands, collections, distributors,
│   │                       # products, orders, cart, wishlist, addresses, reviews,
│   │                       # discounts, content, email-subscribers, store-settings
│   ├── api-spec/           # OpenAPI spec (legacy, from Express era)
│   ├── api-client-react/   # Generated React Query hooks (legacy)
│   └── api-zod/            # Generated Zod schemas
├── scripts/
│   ├── seed.ts             # Database seed script
│   └── post-merge.sh       # Post-merge setup
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Design

- **Brand**: Apex Archery — premium outdoor performance
- **Palette**: Background #0D0D0D, Card #1A1A1A, Muted/Border #2A2A2A, Burnt orange primary (HSL 22 85% 52%), White foreground
- **Style**: Dark editorial aesthetic — cinematic AI archery photography, full-bleed imagery, Hoyt/Quattro-inspired product focus
- **Typography**: Oswald for headings (font-display), Barlow (non-condensed) for body (font-sans) — headings globally uppercase with wider tracking, font-weight 400 (normal)
- **Navbar**: Fixed transparent overlay, becomes solid #0D0D0D on scroll (client component with scroll listener)
- **AI Images**: 10 generated images in `public/images/` — hero.png, cat-*.png (x4 categories), brand-story.png, product-bow-*.png (x3), catalog-banner.png
- **Catalog page**: Quattro-inspired clean layout — breadcrumb nav, category title + description, horizontal filter chips, product count, 3-column grid. "Save X%" rectangular orange badges, "New" white badges
- **Layout**: Full-screen hero (100vh), 4-column category grid, split-screen brand story, featured products section

## Architecture

- **Server Components**: All product pages, catalog, search, and admin pages are server-rendered
- **Client Components**: Cart page, AddToCartButton, SearchForm, AdminProductsClient (marked with "use client")
- **Route Handlers**: Next.js Route Handlers at `/api/*` replace the old Express API
- **Database access**: Server Components import directly from `@workspace/db` (no HTTP layer for SSR)
- **Cart sessions**: localStorage `apex_session_id` for anonymous cart tracking

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Typecheck archery-store**: `pnpm --filter @workspace/archery-store run typecheck`

## Database Schema

16 schema files covering: users/auth, categories (hierarchical), brands, collections, distributors, products (with variants/images/specs/faqs/tags), orders (with items/refunds/fulfillment_logs), cart, wishlist, addresses, reviews, discounts, content (blog/guides/flat pages), email subscribers, store settings.

Enums: UserRole, ProductStatus, FulfillmentStatus, OrderStatus, PaymentStatus, DiscountType, ContentStatus.

- Push schema: `pnpm --filter @workspace/db run push`
- Force push: `pnpm --filter @workspace/db run push-force`
- Seed: `npx tsx scripts/seed.ts`

## API Endpoints (Route Handlers)

All under `/api`:
- Products: CRUD + list with filters (category, brand, price, search, sort, featured)
- Categories: list
- Brands: list
- Cart: CRUD by session ID
- Orders: CRUD + create from cart items
- Checkout: Stripe payment intent (stub mode if no STRIPE_SECRET_KEY)
- Search: full-text product search using PostgreSQL tsvector/tsquery + ILIKE fallback
- Reviews: list by product + create
- Wishlist: CRUD by userId

## Admin

Admin pages at `/admin` with sidebar navigation. Middleware stub at `middleware.ts` checks `x-user-role` header (placeholder for auth).

Pages: Dashboard (revenue/orders/avg value/low stock), Products (table + add form), Orders, Customers, Distributors, Fulfillment logs.

## Important Notes

- Next.js 15 with App Router: async params (e.g., `params: Promise<{ slug: string }>`)
- Tailwind v4: uses `@import "tailwindcss"` + `@tailwindcss/postcss` plugin (no tailwind.config.js)
- Images use `<img>` tags with `{/* eslint-disable-next-line @next/next/no-img-element */}`
- `serverExternalPackages: ["pg"]` in next.config.ts for PostgreSQL compatibility
- Product routes use slug: `/products/[slug]`

## Packages

### `artifacts/archery-store` (`@workspace/archery-store`)

Next.js 15 App Router storefront + admin panel. Server-rendered product pages for SEO. Route handlers for API.

### `lib/db` (`@workspace/db`)

Database layer with 16 Drizzle schema files covering all e-commerce entities.

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

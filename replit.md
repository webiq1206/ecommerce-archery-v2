# Apex Archery E-Commerce

## Overview

Premium archery e-commerce platform ("Apex Archery") built with Next.js 15 App Router, PostgreSQL/Drizzle ORM, Stripe payments, and a full admin panel.

## Stack

- **Node.js version**: 22
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Framework**: Next.js 15 (App Router with Server Components)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **Styling**: Tailwind CSS v4 (postcss plugin)
- **Icons**: lucide-react
- **Fonts**: Oswald (headings), Barlow (body)
- **Payments**: Stripe
- **Auth**: NextAuth v5
- **Email**: Resend + React Email
- **Analytics**: PostHog

## Structure

```text
├── app/                    # Next.js App Router pages and API routes
│   ├── page.tsx            # Homepage
│   ├── layout.tsx          # Root layout
│   ├── products/           # Product catalog and detail pages
│   ├── categories/         # Category listing pages
│   ├── collections/        # Collection pages
│   ├── brands/             # Brand listing
│   ├── blog/               # Blog pages
│   ├── guides/             # Buying guides
│   ├── search/             # Full-text search
│   ├── cart/               # Cart page
│   ├── checkout/           # Checkout + success
│   ├── account/            # Account, orders, addresses, wishlist
│   ├── auth/               # Sign in / error
│   ├── admin/              # Admin panel (dashboard, products, orders, etc.)
│   └── api/                # Route Handlers
├── components/             # Shared UI components
├── hooks/                  # Custom React hooks
├── store/                  # Zustand state stores (cart, wishlist, UI)
├── lib/
│   ├── db/                 # Drizzle ORM client + schema (16 schema files)
│   │   ├── index.ts        # DB connection
│   │   └── schema/         # All table definitions
│   ├── api-zod/            # Generated Zod validation schemas
│   ├── auth.ts             # NextAuth configuration
│   ├── utils.ts            # cn(), formatPrice()
│   ├── email/              # React Email templates
│   ├── seo/                # SEO helpers and JSON-LD schemas
│   └── analytics/          # PostHog analytics utility
├── public/                 # Static assets
├── scripts/
│   └── seed.ts             # Database seed script
├── middleware.ts            # Route protection
├── next.config.ts
├── drizzle.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

## Scripts

- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm start` — Start production server
- `pnpm db:push` — Push Drizzle schema to database
- `pnpm seed` — Seed database with sample data
- `pnpm typecheck` — TypeScript type checking

## Design

- **Brand**: Apex Archery — premium outdoor performance
- **Palette**: Background #0D0D0D, Card #1A1A1A, Burnt orange primary (HSL 22 85% 52%), White foreground
- **Style**: Dark editorial aesthetic with cinematic photography
- **Typography**: Oswald for headings (uppercase, wide tracking), Barlow for body

## Architecture

- **Server Components**: Product pages, catalog, search, admin pages are server-rendered
- **Client Components**: Cart, interactive forms, search, admin clients (marked with "use client")
- **Route Handlers**: Next.js Route Handlers at `/api/*`
- **Database**: Server Components import directly from `@/lib/db`
- **Cart**: Zustand store with localStorage persistence + server sync
- **Auth**: NextAuth v5 with Drizzle adapter, JWT sessions

## Database Schema

16 schema files: users/auth, categories (hierarchical), brands, collections, distributors, products (variants/images/specs/faqs/tags), orders (items/refunds/fulfillment_logs), cart, wishlist, addresses, reviews, discounts, content (blog/guides/pages), email subscribers, store settings.

## Important Notes

- Next.js 15 App Router: async params (e.g., `params: Promise<{ slug: string }>`)
- Tailwind v4: uses `@import "tailwindcss"` + `@tailwindcss/postcss` plugin
- `serverExternalPackages: ["pg"]` in next.config.ts
- Path alias: `@/*` maps to project root

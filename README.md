# TapPOS - Point of Sale for Every Business

A modern, multi-tenant SaaS Point of Sale system built for restaurants, retail, salons, gyms, and more.

## Features

- **Multi-Tenant Architecture** - Each merchant gets their own isolated environment
- **POS Checkout** - Tablet-friendly product grid, cart, and payment processing
- **Payment Processing** - Card, tap to pay, and cash with change calculator (Stripe)
- **Inventory Management** - Products, categories, variants, stock tracking, low-stock alerts
- **Dashboard & Reporting** - Revenue charts, top products, transaction history, CSV export
- **Subscription Billing** - Starter ($29/mo), Pro ($79/mo), Enterprise ($199/mo)
- **Role-Based Access** - Owner, Manager, and Cashier roles
- **Real-Time Updates** - Live order notifications via Socket.IO
- **Discount/Coupons** - Percentage and fixed-amount discount codes

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Payments**: Stripe (Connect + Billing + Payments)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: NextAuth.js (credentials + magic link)
- **Real-time**: Socket.IO
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd tappos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, Stripe keys, etc.

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with demo data
npm run db:seed

# Start the dev server
npm run dev
```

### Demo Credentials

After seeding, you can log in with:

| Role    | Email              | Password      |
|---------|--------------------|---------------|
| Owner   | owner@demo.com     | password123   |
| Manager | manager@demo.com   | password123   |
| Cashier | cashier@demo.com   | password123   |

### Coupon Codes

- `WELCOME10` - 10% off any order
- `SAVE5` - $5 off orders over $20

## Project Structure

```
tappos/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, register pages
│   │   ├── (dashboard)/     # Dashboard, POS, inventory
│   │   ├── api/             # API routes
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── pos/             # POS terminal components
│   │   ├── inventory/       # Inventory components
│   │   ├── dashboard/       # Dashboard components
│   │   └── onboarding/      # Onboarding wizard
│   └── lib/
│       ├── auth.ts          # NextAuth config
│       ├── db.ts            # Prisma client
│       ├── stripe.ts        # Stripe config
│       ├── socket.ts        # Socket.IO server
│       └── utils.ts         # Utilities
├── .env.example
├── railway.json             # Railway deploy config
└── package.json
```

## Deployment (Railway)

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add a PostgreSQL database
4. Connect your GitHub repo
5. Set environment variables (from `.env.example`)
6. Deploy!

Railway will automatically:
- Install dependencies
- Generate Prisma client
- Build the Next.js app
- Run migrations on deploy

## Environment Variables

See `.env.example` for all required variables.

## Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set up Stripe Connect for merchant onboarding
4. Create subscription products/prices for the 3 tiers
5. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`

### Required Webhook Events

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## License

MIT

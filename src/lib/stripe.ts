import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
});

export const PLANS = {
  starter: {
    name: "Starter",
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    features: [
      "1 Register",
      "Up to 100 products",
      "Basic reporting",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    price: 79,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: [
      "5 Registers",
      "Unlimited products",
      "Advanced reporting",
      "Priority support",
      "Inventory alerts",
      "Staff management",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 199,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    features: [
      "Unlimited registers",
      "Unlimited products",
      "Custom reporting",
      "24/7 phone support",
      "API access",
      "Multi-location",
      "Dedicated account manager",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

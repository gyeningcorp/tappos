// Client-safe plan definitions (no server-only imports)
export const PLAN_DETAILS = {
  starter: {
    name: "Starter",
    price: 29,
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

export type PlanKey = keyof typeof PLAN_DETAILS;
